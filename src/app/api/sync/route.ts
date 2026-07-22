import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const from = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  const accounts = await prisma.adAccount.findMany({
    where: { platform: 'FACEBOOK', isActive: true, accessToken: { not: null } }
  })

  let totalSynced = 0
  const errors: string[] = []

  for (const account of accounts) {
    try {
      const insights = await getAccountInsights(account.accountId, from, to)
      for (const day of insights) {
        const conversions = parseConversions(day.actions ?? [])
        const revenue = parseRevenue(day.action_values ?? [])
        const date = new Date(day.date_start)
        const existing = await prisma.campaignMetric.findFirst({
          where: { adAccountId: account.id, date }
        })
        if (existing) {
          await prisma.campaignMetric.update({
            where: { id: existing.id },
            data: { spend: parseFloat(day.spend??'0'), impressions: parseInt(day.impressions??'0'), clicks: parseInt(day.clicks??'0'), conversions, revenue }
          })
        } else {
          await prisma.campaignMetric.create({
            data: { adAccountId: account.id, date, spend: parseFloat(day.spend??'0'), impressions: parseInt(day.impressions??'0'), clicks: parseInt(day.clicks??'0'), conversions, revenue, campaignName: 'Auto Sync' }
          })
        }
        totalSynced++
      }
    } catch (err: any) {
      errors.push(`${account.name}: ${err.message}`)
    }
  }

  return NextResponse.json({ ok: true, synced: totalSynced, accounts: accounts.length, errors })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
