import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncAdAccount, defaultRange } from '@/lib/ad-sync'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { adAccountId, advertiserId, from, to } = await request.json()
  if (!adAccountId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const account = await prisma.adAccount.findUnique({ where: { id: adAccountId } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const range = { ...defaultRange(), ...(from ? { from } : {}), ...(to ? { to } : {}) }
  try {
    const synced = await syncAdAccount({ ...account, accountId: advertiserId ?? account.accountId }, range)
    return NextResponse.json({ ok: true, synced, ...range })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
