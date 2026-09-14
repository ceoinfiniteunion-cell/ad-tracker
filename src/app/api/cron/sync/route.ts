import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue, parseLeads } from '@/lib/meta'
import { refreshAccessToken, getGoogleAdsCampaignMetrics } from '@/lib/google'
import { getToken } from '@/lib/token-store'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const from = new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  const accounts = await prisma.adAccount.findMany({
    where: { isActive: true, platform: 'FACEBOOK', accessToken: { not: null } }
  })

  let totalSynced = 0
  const errors: string[] = []

  for (const account of accounts) {
    try {
      const adAccountId = account.accountId.startsWith('act_') ? account.accountId : `act_${account.accountId}`
      const insights = await getAccountInsights(adAccountId, from, to, account.accessToken!)

      for (const day of insights) {
        const actions = day.actions ?? []
        const actionValues = day.action_values ?? []
        const date = new Date(day.date_start)
        const spend = parseFloat(day.spend ?? '0')
        const impressions = parseInt(day.impressions ?? '0')
        const clicks = parseInt(day.clicks ?? '0')
        const conversions = parseConversions(actions)
        const revenue = parseRevenue(actionValues)
        const leads = parseLeads(actions)
        const reach = parseInt(day.reach ?? '0')
        const frequency = parseFloat(day.frequency ?? '0')
        const ctr = parseFloat(day.ctr ?? '0')
        const cpc = parseFloat(day.cpc ?? '0')
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0

        const platformData = { reach, frequency, ctr, cpc, cpm, leads, costPerLead: leads > 0 ? spend / leads : 0, rawActions: actions, rawActionValues: actionValues }

        const existing = await prisma.campaignMetric.findFirst({ where: { adAccountId: account.id, date } })

        if (existing) {
          await prisma.campaignMetric.update({ where: { id: existing.id }, data: { spend, impressions, clicks, conversions, revenue, campaignName: 'Meta Import', platformData } })
        } else {
          await prisma.campaignMetric.create({ data: { adAccountId: account.id, date, spend, impressions, clicks, conversions, revenue, campaignName: 'Meta Import', platformData } })
        }
        totalSynced++
      }
    } catch (err: any) {
      errors.push(`${account.name}: ${err.message}`)
    }
  }

  // Google Ads sync
  const googleAccounts = await prisma.adAccount.findMany({
    where: { isActive: true, platform: 'GOOGLE', refreshToken: { not: null } },
  })

  for (const account of googleAccounts) {
    try {
      const { refreshToken } = await getToken(account.id)
      if (!refreshToken) { errors.push(`${account.name}: no refresh token`); continue }

      const token = await refreshAccessToken(refreshToken)
      await prisma.adAccount.update({ where: { id: account.id }, data: { tokenStatus: 'valid' } })

      const results = await getGoogleAdsCampaignMetrics(token, account.accountId, from, to)

      const byDate: Record<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number; videoViews: number; campaigns: string[] }> = {}
      for (const row of results) {
        const date = row.segments?.date as string | undefined
        if (!date) continue
        if (!byDate[date]) byDate[date] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, videoViews: 0, campaigns: [] }
        const d = byDate[date]
        d.spend += (Number(row.metrics?.costMicros) || 0) / 1_000_000
        d.impressions += Number(row.metrics?.impressions) || 0
        d.clicks += Number(row.metrics?.clicks) || 0
        d.conversions += Number(row.metrics?.conversions) || 0
        d.revenue += Number(row.metrics?.conversionsValue) || 0
        d.videoViews += Number(row.metrics?.videoViews) || 0
        if (row.campaign?.name) d.campaigns.push(String(row.campaign.name))
      }

      for (const [dateStr, d] of Object.entries(byDate)) {
        const date = new Date(dateStr)
        const platformData = {
          videoViews: d.videoViews,
          ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
          cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
          cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
          roas: d.spend > 0 ? d.revenue / d.spend : 0,
          costPerConversion: d.conversions > 0 ? d.spend / d.conversions : 0,
          campaigns: Array.from(new Set(d.campaigns)) as string[],
        }
        const existing = await prisma.campaignMetric.findFirst({ where: { adAccountId: account.id, date } })
        if (existing) {
          await prisma.campaignMetric.update({ where: { id: existing.id }, data: { spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions, revenue: d.revenue, campaignName: 'Google Ads Import', platformData } })
        } else {
          await prisma.campaignMetric.create({ data: { adAccountId: account.id, date, spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions, revenue: d.revenue, campaignName: 'Google Ads Import', platformData } })
        }
        totalSynced++
      }
    } catch (err: any) {
      errors.push(`${account.name}: ${err.message}`)
    }
  }

  return NextResponse.json({ ok: true, synced: totalSynced, accounts: accounts.length + googleAccounts.length, errors, from, to })
}
