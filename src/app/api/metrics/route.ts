import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const from = searchParams.get('from') ?? getDefaultFrom()
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  const sessionClientId = (session.user as any).clientId
  const role = (session.user as any).role
  const resolvedClientId = role === 'ADMIN' ? clientId : sessionClientId
  if (!resolvedClientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const client = await prisma.client.findUnique({
    where: { id: resolvedClientId },
    include: {
      adAccounts: {
        where: { isActive: true },
        include: {
          metrics: {
            where: { date: { gte: new Date(from), lte: new Date(to) } },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const platforms = client.adAccounts.map((account) => {
    const metrics = account.metrics
    const pd = (m: any) => (m.platformData as any) ?? {}

    const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
    const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0)
    const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0)
    const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0)
    const totalReach = metrics.reduce((s, m) => s + (pd(m).reach ?? 0), 0)
    const totalVideoViews = metrics.reduce((s, m) => s + (pd(m).videoViews ?? 0), 0)
    const totalLeads = metrics.reduce((s, m) => s + (pd(m).leads ?? 0), 0)
    const totalPostEngagement = metrics.reduce((s, m) => s + (pd(m).postEngagement ?? 0), 0)
    const totalLinkClicks = metrics.reduce((s, m) => s + (pd(m).linkClicks ?? 0), 0)
    const totalLandingPageViews = metrics.reduce((s, m) => s + (pd(m).landingPageViews ?? 0), 0)
    const totalComments = metrics.reduce((s, m) => s + (pd(m).comments ?? 0), 0)
    const totalShares = metrics.reduce((s, m) => s + (pd(m).shares ?? 0), 0)
    const totalVideoP100 = metrics.reduce((s, m) => s + (pd(m).videoP100 ?? 0), 0)

    return {
      platform: account.platform,
      accountName: account.name,
      accountId: account.accountId,
      summary: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        totalReach,
        totalVideoViews,
        totalLeads,
        totalPostEngagement,
        totalLinkClicks,
        totalLandingPageViews,
        totalComments,
        totalShares,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        cpp: totalReach > 0 ? (totalSpend / totalReach) * 1000 : 0,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        costPerConversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
        costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
        frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
        videoCompletionRate: totalVideoViews > 0 ? (totalVideoP100 / totalVideoViews) * 100 : 0,
      },
      daily: metrics.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: m.revenue,
        reach: pd(m).reach ?? 0,
        frequency: pd(m).frequency ?? 0,
        ctr: pd(m).ctr ?? 0,
        cpc: pd(m).cpc ?? 0,
        cpm: pd(m).cpm ?? 0,
        videoViews: pd(m).videoViews ?? 0,
        leads: pd(m).leads ?? 0,
        postEngagement: pd(m).postEngagement ?? 0,
        linkClicks: pd(m).linkClicks ?? 0,
        landingPageViews: pd(m).landingPageViews ?? 0,
        comments: pd(m).comments ?? 0,
        shares: pd(m).shares ?? 0,
      })),
    }
  })

  const allMetrics = platforms.map((p) => p.summary)
  const totalSpend = allMetrics.reduce((s, m) => s + m.totalSpend, 0)
  const totalImpressions = allMetrics.reduce((s, m) => s + m.totalImpressions, 0)
  const totalClicks = allMetrics.reduce((s, m) => s + m.totalClicks, 0)
  const totalConversions = allMetrics.reduce((s, m) => s + m.totalConversions, 0)
  const totalRevenue = allMetrics.reduce((s, m) => s + m.totalRevenue, 0)
  const totalReach = allMetrics.reduce((s, m) => s + m.totalReach, 0)
  const totalVideoViews = allMetrics.reduce((s, m) => s + m.totalVideoViews, 0)
  const totalLeads = allMetrics.reduce((s, m) => s + m.totalLeads, 0)
  const totalPostEngagement = allMetrics.reduce((s, m) => s + m.totalPostEngagement, 0)
  const totalVideoP100 = allMetrics.reduce((s, m) => s + (m as any).totalVideoP100, 0)

  return NextResponse.json({
    client: { id: client.id, name: client.name, company: client.company },
    dateRange: { from, to },
    platforms,
    totals: {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      totalReach,
      totalVideoViews,
      totalLeads,
      totalPostEngagement,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cpp: totalReach > 0 ? (totalSpend / totalReach) * 1000 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      costPerConversion: totalConversions > 0 ? totalSpend / totalConversions : 0,
      costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
      frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      videoCompletionRate: totalVideoViews > 0 ? (totalVideoP100 / totalVideoViews) * 100 : 0,
    },
  })
}

function getDefaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
