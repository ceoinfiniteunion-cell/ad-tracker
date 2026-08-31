import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTikTokInsights } from '@/lib/tiktok'
import { getToken } from '@/lib/token-store'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { adAccountId, advertiserId, from, to } = await request.json()
  if (!adAccountId || !advertiserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const dateFrom = from ?? new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
  const dateTo = to ?? new Date().toISOString().split('T')[0]

  const account = await prisma.adAccount.findUnique({ where: { id: adAccountId } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Декриптуємо токен
  const { accessToken } = await getToken(adAccountId)
  if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 404 })

  try {
    const rows = await getTikTokInsights(advertiserId, dateFrom, dateTo, accessToken)

    let synced = 0
    for (const row of rows) {
      const m = row.metrics ?? {}
      const d = row.dimensions ?? {}
      const dateStr = d.stat_time_day?.split(' ')[0]
      if (!dateStr) continue

      const date = new Date(dateStr)
      const spend = parseFloat(m.spend ?? '0')
      const impressions = parseInt(m.impressions ?? '0')
      const clicks = parseInt(m.clicks ?? '0')
      const conversions = parseFloat(m.conversions ?? '0')
      const reach = parseInt(m.reach ?? '0')
      const videoViews = parseInt(m.video_play_actions ?? '0')

      const platformData = {
        reach,
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
        costPerConversion: parseFloat(m.cost_per_conversion ?? '0'),
        conversionRate: parseFloat(m.conversion_rate ?? '0'),
      }

      await prisma.campaignMetric.upsert({
        where: { adAccountId_date: { adAccountId, date } },
        update: { spend, impressions, clicks, conversions, revenue: 0, campaignName: 'TikTok Import', platformData },
        create: { adAccountId, date, spend, impressions, clicks, conversions, revenue: 0, campaignName: 'TikTok Import', platformData },
      })
      synced++
    }

    return NextResponse.json({ ok: true, synced, from: dateFrom, to: dateTo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
