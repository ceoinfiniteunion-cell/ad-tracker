import { prisma } from './prisma'
import { getToken, saveToken } from './token-store'
import { refreshAccessToken, getGoogleAdsCampaignMetrics } from './google'
import { getAccountInsights, parseConversions, parseRevenue, parseLeads } from './meta'
import { getTikTokInsights } from './tiktok'

// Синхронізація метрик одного кабінету. Спільна для ручного sync, cron і авто-sync після OAuth.

type Account = { id: string; accountId: string; platform: string; loginCustomerId?: string | null }

export function defaultRange(days = 30): { from: string; to: string } {
  return {
    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  }
}

async function saveDay(adAccountId: string, date: Date, campaignName: string, values: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }, platformData: any) {
  await prisma.campaignMetric.upsert({
    where: { adAccountId_date: { adAccountId, date } },
    update: { ...values, campaignName, platformData },
    create: { adAccountId, date, ...values, campaignName, platformData },
  })
}

export async function syncGoogleAccount(account: Account, from: string, to: string): Promise<number> {
  const { accessToken: storedAccess, refreshToken } = await getToken(account.id)
  if (!storedAccess && !refreshToken) throw new Error('Немає токена Google — підключіть кабінет ще раз')

  let token = storedAccess!
  if (refreshToken) {
    token = await refreshAccessToken(refreshToken)
    await saveToken(account.id, token, refreshToken)
  }

  const results = await getGoogleAdsCampaignMetrics(token, account.accountId, from, to, account.loginCustomerId)

  const byDate: Record<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; videoViews: number; campaigns: string[] }> = {}
  for (const row of results) {
    const date = row.segments?.date as string | undefined
    if (!date) continue
    const d = byDate[date] ??= { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, videoViews: 0, campaigns: [] }
    d.spend += (Number(row.metrics?.costMicros) || 0) / 1_000_000
    d.impressions += Number(row.metrics?.impressions) || 0
    d.clicks += Number(row.metrics?.clicks) || 0
    d.conversions += Number(row.metrics?.conversions) || 0
    d.revenue += Number(row.metrics?.conversionsValue) || 0
    d.videoViews += Number(row.metrics?.videoTrueviewViews) || 0
    if (row.campaign?.name) d.campaigns.push(String(row.campaign.name))
  }

  for (const [dateStr, d] of Object.entries(byDate)) {
    await saveDay(account.id, new Date(dateStr), 'Google Ads Import',
      { spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions, revenue: d.revenue },
      {
        videoViews: d.videoViews,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
        cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
        costPerConversion: d.conversions > 0 ? d.spend / d.conversions : 0,
        campaigns: Array.from(new Set(d.campaigns)),
      })
  }
  return Object.keys(byDate).length
}

const actionValue = (actions: any[], type: string) => Number(actions.find((a: any) => a.action_type === type)?.value ?? 0)

export async function syncMetaAccount(account: Account, from: string, to: string): Promise<number> {
  const { accessToken: stored } = await getToken(account.id)
  const accessToken = stored ?? process.env.META_ACCESS_TOKEN
  if (!accessToken) throw new Error('Немає токена Meta — підключіть кабінет ще раз')

  const normalizedId = account.accountId.startsWith('act_') ? account.accountId : `act_${account.accountId}`
  const insights = await getAccountInsights(normalizedId, from, to, accessToken)

  for (const day of insights) {
    const actions = day.actions ?? []
    const actionValues = day.action_values ?? []
    const conversions = parseConversions(actions)
    const revenue = parseRevenue(actionValues)
    const leads = parseLeads(actions)
    const spend = parseFloat(day.spend ?? '0')
    const impressions = parseInt(day.impressions ?? '0')
    const clicks = parseInt(day.clicks ?? '0')
    const videoViews = actionValue(actions, 'video_view')
    const videoP100 = actionValue(actions, 'video_watched_100_p')

    await saveDay(account.id, new Date(day.date_start), 'Meta Import', { spend, impressions, clicks, conversions, revenue }, {
      reach: parseInt(day.reach ?? '0'),
      frequency: parseFloat(day.frequency ?? '0'),
      ctr: parseFloat(day.ctr ?? '0'),
      cpc: parseFloat(day.cpc ?? '0'),
      cpp: parseFloat(day.cpp ?? '0'),
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      leads,
      costPerLead: leads > 0 ? spend / leads : 0,
      costPerConversion: conversions > 0 ? spend / conversions : 0,
      videoViews,
      videoP25: actionValue(actions, 'video_watched_25_p'),
      videoP50: actionValue(actions, 'video_watched_50_p'),
      videoP75: actionValue(actions, 'video_watched_75_p'),
      videoP100,
      videoCompletionRate: videoViews > 0 ? (videoP100 / videoViews) * 100 : 0,
      postEngagement: actionValue(actions, 'post_engagement'),
      pageLikes: actionValue(actions, 'like'),
      linkClicks: actionValue(actions, 'link_click'),
      landingPageViews: actionValue(actions, 'landing_page_view'),
      comments: actionValue(actions, 'comment'),
      shares: actionValue(actions, 'post'),
      rawActions: actions,
      rawActionValues: actionValues,
    })
  }
  return insights.length
}

function dateChunks(from: string, to: string, chunkDays = 30): Array<{ from: string; to: string }> {
  const chunks = []
  let start = new Date(from)
  const end = new Date(to)
  while (start <= end) {
    const chunkEnd = new Date(start)
    chunkEnd.setDate(chunkEnd.getDate() + chunkDays - 1)
    if (chunkEnd > end) chunkEnd.setTime(end.getTime())
    chunks.push({ from: start.toISOString().split('T')[0], to: chunkEnd.toISOString().split('T')[0] })
    start = new Date(chunkEnd)
    start.setDate(start.getDate() + 1)
  }
  return chunks
}

export async function syncTikTokAccount(account: Account, from: string, to: string): Promise<number> {
  const { accessToken } = await getToken(account.id)
  if (!accessToken) throw new Error('Немає токена TikTok — підключіть кабінет ще раз')

  // TikTok-метрики зберігаються в USD (кабінети в UAH), як і раніше
  let uahToUsd = 1 / 41
  try {
    const rateData = await (await fetch('https://open.er-api.com/v6/latest/UAH', { signal: AbortSignal.timeout(5000) })).json()
    uahToUsd = rateData.rates?.USD ?? uahToUsd
  } catch {}

  let synced = 0
  for (const chunk of dateChunks(from, to)) {
    const rows = await getTikTokInsights(account.accountId, chunk.from, chunk.to, accessToken)
    for (const row of rows) {
      const m = row.metrics ?? {}
      const dateStr = row.dimensions?.stat_time_day?.split(' ')[0]
      if (!dateStr) continue
      const videoViews = parseInt(m.video_play_actions ?? '0')
      await saveDay(account.id, new Date(dateStr), 'TikTok Import', {
        spend: parseFloat(m.spend ?? '0') * uahToUsd,
        impressions: parseInt(m.impressions ?? '0'),
        clicks: parseInt(m.clicks ?? '0'),
        conversions: parseInt(m.real_time_conversion ?? m.result ?? '0'),
        revenue: 0,
      }, {
        reach: parseInt(m.reach ?? '0'),
        frequency: parseFloat(m.frequency ?? '0'),
        ctr: parseFloat(m.ctr ?? '0'),
        cpc: parseFloat(m.cpc ?? '0'),
        cpm: parseFloat(m.cpm ?? '0'),
        videoViews,
        videoWatched2s: parseInt(m.video_watched_2s ?? '0'),
        videoWatched6s: parseInt(m.video_watched_6s ?? '0'),
        videoP25: parseInt(m.video_views_p25 ?? '0'),
        videoP50: parseInt(m.video_views_p50 ?? '0'),
        videoP75: parseInt(m.video_views_p75 ?? '0'),
        videoP100: parseInt(m.video_views_p100 ?? '0'),
        videoCompletionRate: videoViews > 0 ? (parseInt(m.video_views_p100 ?? '0') / videoViews) * 100 : 0,
        likes: parseInt(m.likes ?? '0'),
        comments: parseInt(m.comments ?? '0'),
        shares: parseInt(m.shares ?? '0'),
        follows: parseInt(m.follows ?? '0'),
        profileVisits: parseInt(m.profile_visits ?? '0'),
        conversionRate: parseFloat(m.conversion_rate ?? '0'),
      })
      synced++
    }
  }
  return synced
}

export async function syncAdAccount(account: Account, range = defaultRange()): Promise<number> {
  const synced =
    account.platform === 'GOOGLE' ? await syncGoogleAccount(account, range.from, range.to)
    : account.platform === 'FACEBOOK' ? await syncMetaAccount(account, range.from, range.to)
    : account.platform === 'TIKTOK' ? await syncTikTokAccount(account, range.from, range.to)
    : 0
  await prisma.adAccount.update({ where: { id: account.id }, data: { tokenStatus: 'valid' } })
  return synced
}
