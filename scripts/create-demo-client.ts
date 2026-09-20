import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function upsertAccount(clientId: string, name: string, accountId: string, platform: any) {
  const existing = await prisma.adAccount.findFirst({ where: { clientId, accountId } })
  if (existing) return existing
  return prisma.adAccount.create({ data: { clientId, name, accountId, platform, isActive: true } })
}

async function main() {
  const password = await bcrypt.hash('Demo2026!', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@infiniteunion.com.ua' },
    update: { password, status: 'ACTIVE' },
    create: {
      email: 'demo@infiniteunion.com.ua',
      password,
      name: 'Demo Client',
      company: 'Acme Marketing Co.',
      role: 'CLIENT',
      status: 'ACTIVE',
    }
  })

  const client = await prisma.client.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, name: 'Demo Client', company: 'Acme Marketing Co.', currency: 'USD' }
  })

  const metaAcc = await upsertAccount(client.id, 'Acme Store — Meta', 'act_demo_meta_001', 'FACEBOOK')
  const googleAcc = await upsertAccount(client.id, 'Acme Store — Google', 'demo_google_001', 'GOOGLE')
  const tiktokAcc = await upsertAccount(client.id, 'Acme Store — TikTok', 'demo_tiktok_001', 'TIKTOK')

  const accounts = [
    { acc: metaAcc,   spendBase: 180, impBase: 36000, clickBase: 810, convBase: 22, revBase: 1100 },
    { acc: googleAcc, spendBase: 150, impBase: 27000, clickBase: 950, convBase: 18, revBase: 900 },
    { acc: tiktokAcc, spendBase: 65,  impBase: 16000, clickBase: 460, convBase: 10, revBase: 500 },
  ]

  for (const { acc, spendBase, impBase, clickBase, convBase, revBase } of accounts) {
    console.log(`Filling metrics for ${acc.name}...`)
    for (let i = 89; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const rand = (base: number) => Math.round(base * (0.7 + Math.random() * 0.6))
      const weekend = (date.getDay() === 0 || date.getDay() === 6) ? 0.7 : 1

      const impressions = Math.round(rand(impBase) * weekend)
      const clicks = Math.round(rand(clickBase) * weekend)
      const conversions = Math.round(rand(convBase) * weekend)
      const spend = parseFloat((rand(spendBase) * weekend).toFixed(2))
      const revenue = parseFloat((rand(revBase) * weekend).toFixed(2))

      const existing = await prisma.campaignMetric.findFirst({ where: { adAccountId: acc.id, date } })
      if (!existing) {
        await prisma.campaignMetric.create({
          data: {
            adAccountId: acc.id,
            date,
            spend,
            impressions,
            clicks,
            conversions,
            revenue,
            campaignName: `${acc.name} Campaign`,
            platformData: {
              reach: Math.round(impressions * 0.45),
              frequency: parseFloat((impressions / Math.max(impressions * 0.45, 1)).toFixed(2)),
              ctr: parseFloat(((clicks / Math.max(impressions, 1)) * 100).toFixed(2)),
              cpc: parseFloat((spend / Math.max(clicks, 1)).toFixed(2)),
              cpm: parseFloat(((spend / Math.max(impressions, 1)) * 1000).toFixed(2)),
              leads: Math.round(conversions * 0.3),
              videoViews: Math.round(impressions * 0.15),
            }
          }
        })
      }
    }
  }

  console.log('\n✅ Done!')
  console.log('📧 Email:    demo@infiniteunion.com.ua')
  console.log('🔑 Password: Demo2026!')
  console.log('🌐 URL:      https://ad-tracker-production-7c7a.up.railway.app')
}

main().catch(console.error).finally(() => prisma.$disconnect())
