import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { refreshAccessToken, getGoogleAdsCampaignMetrics } from '@/lib/google'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { adAccountId, customerId, from, to } = await request.json()
  if (!adAccountId || !customerId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const dateFrom = from ?? new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
  const dateTo = to ?? new Date().toISOString().split('T')[0]

  const account = await prisma.adAccount.findUnique({ where: { id: adAccountId } })
  if (!account?.accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 404 })
  }

  try {
    let token = account.accessToken
    if (account.refreshToken) {
      try {
        token = await refreshAccessToken(account.refreshToken)
        await prisma.adAccount.update({
          where: { id: adAccountId },
          data: { accessToken: token, tokenStatus: 'active' },
        })
      } catch {}
    }

    const results = await getGoogleAdsCampaignMetrics(token, customerId, dateFrom, dateTo)

    const byDate: Record<string, any> = {}
    for (const row of results) {
      const date = row.segments?.date
      if (!date) continue
      if (!byDate[date]) byDate[date] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, videoViews: 0, campaigns: [] }
      const d = byDate[date]
      d.spend += (row.metrics?.costMicros ?? 0) / 1_000_000
      d.impressions += row.metrics?.impressions ?? 0
      d.clicks += row.metrics?.clicks ?? 0
      d.conversions += row.metrics?.conversions ?? 0
      d.revenue += row.metrics?.conversionsValue ?? 0
      d.videoViews += row.metrics?.videoViews ?? 0
      if (row.campaign?.name) d.campaigns.push(row.campaign.name)
    }

    let synced = 0
    for (const [dateStr, d] of Object.entries(byDate)) {
      const date = new Date(dateStr)
      const platformData = {
        videoViews: d.videoViews,
        ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
        cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
        cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
        costPerConversion: d.conversions > 0 ? d.spend / d.conversions : 0,
        campaigns: [...new Set(d.campaigns)],
      }

      const existing = await prisma.campaignMetric.findFirst({
        where: { adAccountId, date },
      })

      if (existing) {
        await prisma.campaignMetric.update({
          where: { id: existing.id },
          data: { spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions, revenue: d.revenue, campaignName: 'Google Ads Import', platformData },
        })
      } else {
        await prisma.campaignMetric.create({
          data: { adAccountId, date, spend: d.spend, impressions: d.impressions, clicks: d.clicks, conversions: d.conversions, revenue: d.revenue, campaignName: 'Google Ads Import', platformData },
        })
      }
      synced++
    }

    return NextResponse.json({ ok: true, synced, from: dateFrom, to: dateTo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
