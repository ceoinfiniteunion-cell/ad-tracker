import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncAdAccount } from '@/lib/ad-sync'
import { rateLimit } from '@/lib/rate-limit'

// Ручний sync свого кабінету (клієнт) або будь-якого (адмін)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  const isAdmin = user.role === 'ADMIN'
  if (!isAdmin && !user.clientId) return NextResponse.json({ error: 'Not a client' }, { status: 403 })

  const account = await prisma.adAccount.findFirst({ where: { id: params.id, ...(isAdmin ? {} : { clientId: user.clientId }) } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { ok } = await rateLimit(`sync:${account.id}`, 5, 10 * 60 * 1000)
  if (!ok) return NextResponse.json({ error: 'Забагато синхронізацій. Спробуйте за 10 хвилин.' }, { status: 429 })

  try {
    const synced = await syncAdAccount(account)
    return NextResponse.json({ ok: true, synced })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
