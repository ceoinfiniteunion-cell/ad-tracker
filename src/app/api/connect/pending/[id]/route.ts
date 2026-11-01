import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { connectAndSync, deletePendingConnection, loadPendingConnection } from '@/lib/ad-connect'

type Ctx = { params: { id: string } }

async function load(params: Ctx['params']) {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return loadPendingConnection(params.id, (session.user as any).id)
}

// Список знайдених кабінетів для вибору (без токенів)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const pending = await load(params)
  if (!pending) return NextResponse.json({ error: 'Час на вибір минув. Підключіть платформу ще раз.' }, { status: 404 })

  const existing = await prisma.adAccount.findMany({
    where: { platform: pending.platform, accountId: { in: pending.accounts.map(a => a.externalId) } },
    select: { accountId: true, clientId: true },
  })
  const owner = new Map(existing.map(e => [e.accountId, e.clientId]))

  return NextResponse.json({
    platform: pending.platform,
    accounts: pending.accounts.map(a => ({
      externalId: a.externalId,
      name: a.name,
      currency: a.currency ?? null,
      viaManager: a.loginCustomerId ?? null,
      status: !owner.has(a.externalId) ? 'new' : owner.get(a.externalId) === pending.clientId ? 'connected' : 'taken',
    })),
  })
}

// Підключити вибрані кабінети і одразу синхронізувати
export async function POST(request: NextRequest, { params }: Ctx) {
  const pending = await load(params)
  if (!pending) return NextResponse.json({ error: 'Час на вибір минув. Підключіть платформу ще раз.' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const selected = new Set<string>(Array.isArray(body.selected) ? body.selected.map(String) : [])
  const accounts = pending.accounts.filter(a => selected.has(a.externalId))
  if (accounts.length === 0) return NextResponse.json({ error: 'Виберіть хоча б один кабінет' }, { status: 400 })

  const result = await connectAndSync(pending.clientId, pending.platform, pending.tokens, accounts)
  await deletePendingConnection(pending.id)
  return NextResponse.json({ ok: true, ...result })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const pending = await load(params)
  if (pending) await deletePendingConnection(pending.id)
  return NextResponse.json({ ok: true })
}
