import { PrismaClient, Platform } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Создаём admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@youragency.com' },
    update: {},
    create: {
      email: 'admin@youragency.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Создаём тестового клиента
  const clientPassword = await bcrypt.hash('client123', 12)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      name: 'Иван Петренко',
      role: 'CLIENT',
      client: {
        create: {
          name: 'Иван Петренко',
          company: 'ООО "Тест Компания"',
          adAccounts: {
            create: [
              {
                name: 'Facebook - Тест',
                accountId: 'act_123456789',
                platform: Platform.FACEBOOK,
              },
              {
                name: 'Google Ads - Тест',
                accountId: '123-456-7890',
                platform: Platform.GOOGLE,
              },
              {
                name: 'TikTok - Тест',
                accountId: '7123456789012345678',
                platform: Platform.TIKTOK,
              },
            ],
          },
        },
      },
    },
    include: { client: { include: { adAccounts: true } } },
  })
  console.log('✅ Client created:', clientUser.email)

  // Генерируем тестовые метрики за последние 30 дней
  const accounts = clientUser.client?.adAccounts ?? []
  const today = new Date()

  for (const account of accounts) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      await prisma.campaignMetric.create({
        data: {
          adAccountId: account.id,
          date,
          spend: Math.random() * 500 + 100,
          impressions: Math.floor(Math.random() * 50000 + 5000),
          clicks: Math.floor(Math.random() * 2000 + 200),
          conversions: Math.floor(Math.random() * 50 + 5),
          revenue: Math.random() * 2000 + 500,
          campaignName: `Кампания ${account.platform} #${Math.floor(Math.random() * 3) + 1}`,
        },
      })
    }
  }
  console.log('✅ Test metrics generated')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
