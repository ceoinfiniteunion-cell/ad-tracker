import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const from = searchParams.get('from') ?? getDefaultFrom()
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]

  // Клиент может смотреть только свои данные
  const sessionClientId = (session.user as any).clientId
  const role = (session.user as any).role

  const resolvedClientId = role === 'ADMIN' ? clientId : sessionClientId

  if (!resolvedClientId) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const client = await prisma.client.findUnique({
    where: { id: resolvedClientId },
    include: {
      adAccounts: {
        where: { isActive: true },
        include: {
          metrics: {
            where: {
              date: {
                gte: new Date(from),
                lte: new Date(to),
              },
            },
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Формируем данные по платформам
  const platforms = client.adAccounts.map((account) => {
    const metrics = account.metrics
    const totalSpend = metrics.reduce((s, m) => s + m.spend, 0)
    const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0)
    const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0)
    const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0)

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
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      },
      daily: metrics.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        spend: m.spend,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: m.revenue,
      })),
    }
  })

  // Общие суммарные метрики
  const allMetrics = platforms.map((p) => p.summary)
  const totalSpend = allMetrics.reduce((s, m) => s + m.totalSpend, 0)
  const totalImpressions = allMetrics.reduce((s, m) => s + m.totalImpressions, 0)
  const totalClicks = allMetrics.reduce((s, m) => s + m.totalClicks, 0)
  const totalConversions = allMetrics.reduce((s, m) => s + m.totalConversions, 0)
  const totalRevenue = allMetrics.reduce((s, m) => s + m.totalRevenue, 0)

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
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    },
  })
}

function getDefaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}
