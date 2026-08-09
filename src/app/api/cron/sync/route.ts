import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccountInsights, parseConversions, parseRevenue, parseLeads } from '@/lib/meta'

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

  return NextResponse.json({ ok: true, synced: totalSynced, accounts: accounts.length, errors, from, to })
}
