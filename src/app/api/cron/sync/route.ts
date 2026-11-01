import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCronRequest } from '@/lib/cron-auth'
import { syncAdAccount, defaultRange } from '@/lib/ad-sync'

// Щоденний sync останніх 3 днів для всіх активних кабінетів з токенами (Meta, Google, TikTok)
export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = defaultRange(3)
  const accounts = await prisma.adAccount.findMany({
    where: {
      isActive: true,
      OR: [
        { platform: 'FACEBOOK', accessToken: { not: null } },
        { platform: 'TIKTOK', accessToken: { not: null } },
        { platform: 'GOOGLE', refreshToken: { not: null } },
      ],
    },
  })

  let totalSynced = 0
  const errors: string[] = []
  for (const account of accounts) {
    try {
      totalSynced += await syncAdAccount(account, range)
    } catch (err: any) {
      errors.push(`${account.platform} ${account.name}: ${err.message}`)
    }
  }

  return NextResponse.json({ ok: true, synced: totalSynced, accounts: accounts.length, errors, ...range })
}
