import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue, parseLeads } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { accountId, adAccountId, from, to } = await request.json()
  if (!accountId || !adAccountId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const dateFrom = from ?? new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
  const dateTo = to ?? new Date().toISOString().split('T')[0]

  try {
    const insights = await getAccountInsights(adAccountId, dateFrom, dateTo)
    let synced = 0

    for (const day of insights) {
      const actions = day.actions ?? []
      const actionValues = day.action_values ?? []

      const conversions = parseConversions(actions)
      const revenue = parseRevenue(actionValues)
      const leads = parseLeads(actions)
      const date = new Date(day.date_start)
      const spend = parseFloat(day.spend ?? '0')
      const impressions = parseInt(day.impressions ?? '0')
      const clicks = parseInt(day.clicks ?? '0')
      const reach = parseInt(day.reach ?? '0')
      const frequency = parseFloat(day.frequency ?? '0')
      const ctr = parseFloat(day.ctr ?? '0')
      const cpc = parseFloat(day.cpc ?? '0')
      const cpp = parseFloat(day.cpp ?? '0')
      const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0

      // Парсимо відео перегляди
      const videoViews = actions.find((a: any) => a.action_type === 'video_view')?.value ?? 0
      const videoP25 = actions.find((a: any) => a.action_type === 'video_watched_25_p')?.value ?? 0
      const videoP50 = actions.find((a: any) => a.action_type === 'video_watched_50_p')?.value ?? 0
      const videoP75 = actions.find((a: any) => a.action_type === 'video_watched_75_p')?.value ?? 0
      const videoP100 = actions.find((a: any) => a.action_type === 'video_watched_100_p')?.value ?? 0

      // Engagement
      const postEngagement = actions.find((a: any) => a.action_type === 'post_engagement')?.value ?? 0
      const pageLikes = actions.find((a: any) => a.action_type === 'like')?.value ?? 0
      const linkClicks = actions.find((a: any) => a.action_type === 'link_click')?.value ?? 0
      const landingPageViews = actions.find((a: any) => a.action_type === 'landing_page_view')?.value ?? 0
      const comments = actions.find((a: any) => a.action_type === 'comment')?.value ?? 0
      const shares = actions.find((a: any) => a.action_type === 'post')?.value ?? 0

      const platformData = {
        // Meta специфічні поля
        reach,
        frequency,
        ctr,
        cpc,
        cpp,
        cpm,
        leads,
        costPerLead: leads > 0 ? spend / leads : 0,
        costPerConversion: conversions > 0 ? spend / conversions : 0,
        // Відео
        videoViews: Number(videoViews),
        videoP25: Number(videoP25),
        videoP50: Number(videoP50),
        videoP75: Number(videoP75),
        videoP100: Number(videoP100),
        videoCompletionRate: Number(videoViews) > 0 ? (Number(videoP100) / Number(videoViews)) * 100 : 0,
        // Engagement
        postEngagement: Number(postEngagement),
        pageLikes: Number(pageLikes),
        linkClicks: Number(linkClicks),
        landingPageViews: Number(landingPageViews),
        comments: Number(comments),
        shares: Number(shares),
        // Сирі дані
        rawActions: actions,
        rawActionValues: actionValues,
      }

      const existing = await prisma.campaignMetric.findFirst({
        where: { adAccountId: accountId, date }
      })

      if (existing) {
        await prisma.campaignMetric.update({
          where: { id: existing.id },
          data: { spend, impressions, clicks, conversions, revenue, campaignName: 'Meta Import', platformData }
        })
      } else {
        await prisma.campaignMetric.create({
          data: { adAccountId: accountId, date, spend, impressions, clicks, conversions, revenue, campaignName: 'Meta Import', platformData }
        })
      }
      synced++
    }

    return NextResponse.json({ ok: true, synced, from: dateFrom, to: dateTo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
