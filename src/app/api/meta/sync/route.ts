import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { accountId, adAccountId, from, to } = await request.json()
  if (!accountId || !adAccountId) {
    return NextResponse.json({ error: 'Missing accountId or adAccountId' }, { status: 400 })
  }
  const dateFrom = from ?? (() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0] })()
  const dateTo = to ?? new Date().toISOString().split('T')[0]
  try {
    const insights = await getAccountInsights(adAccountId, dateFrom, dateTo)
    let synced = 0
    for (const day of insights) {
      const conversions = parseConversions(day.actions ?? [])
      const revenue = parseRevenue(day.action_values ?? [])
      await prisma.campaignMetric.upsert({
        where: { adAccountId_date: { adAccountId: accountId, date: new Date(day.date_start) } },
        update: { spend: parseFloat(day.spend??'0'), impressions: parseInt(day.impressions??'0'), clicks: parseInt(day.clicks??'0'), conversions, revenue },
        create: { adAccountId: accountId, date: new Date(day.date_start), spend: parseFloat(day.spend??'0'), impressions: parseInt(day.impressions??'0'), clicks: parseInt(day.clicks??'0'), conversions, revenue, campaignName: 'Meta Import' }
      })
      synced++
    }
    return NextResponse.json({ ok: true, synced, from: dateFrom, to: dateTo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
