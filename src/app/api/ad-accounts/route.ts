import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/ad-accounts — додати кабінет
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { clientId, name, accountId, platform } = await request.json()
  if (!clientId || !name || !accountId || !platform) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  try {
    const account = await prisma.adAccount.create({
      data: { clientId, name, accountId, platform }
    })
    return NextResponse.json(account, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Кабінет з таким ID вже існує для цієї платформи' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/ad-accounts?id=xxx — видалити кабінет
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.adAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// PATCH /api/ad-accounts?id=xxx — toggle isActive
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { isActive } = await request.json()
  const account = await prisma.adAccount.update({ where: { id }, data: { isActive } })
  return NextResponse.json(account)
}
