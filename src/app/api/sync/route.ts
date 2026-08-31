import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue } from '@/lib/meta'
import { getToken } from '@/lib/token-store'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const from = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  const accounts = await prisma.adAccount.findMany({
    where: { platform: 'FACEBOOK', isActive: true, accessToken: { not: null } },
    take: 100,
  })

  let totalSynced = 0
  const errors: string[] = []

  for (const account of accounts) {
    try {
      // Декриптуємо токен
      const { accessToken } = await getToken(account.id)
      if (!accessToken) {
        errors.push(`${account.name}: no token`)
        continue
      }

      const insights = await getAccountInsights(account.accountId, from, to, accessToken)

      for (const day of insights) {
        const conversions = parseConversions(day.actions ?? [])
        const revenue = parseRevenue(day.action_values ?? [])
        const date = new Date(day.date_start)

        // upsert замість findFirst + update/create
        await prisma.campaignMetric.upsert({
          where: {
            adAccountId_date: { adAccountId: account.id, date }
          },
          update: {
            spend: parseFloat(day.spend ?? '0'),
            impressions: parseInt(day.impressions ?? '0'),
            clicks: parseInt(day.clicks ?? '0'),
            conversions,
            revenue,
          },
          create: {
            adAccountId: account.id,
            date,
            spend: parseFloat(day.spend ?? '0'),
            impressions: parseInt(day.impressions ?? '0'),
            clicks: parseInt(day.clicks ?? '0'),
            conversions,
            revenue,
            campaignName: 'Auto Sync',
          },
        })
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
