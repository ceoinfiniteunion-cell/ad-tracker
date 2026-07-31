import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const sessionClientId = (session.user as any).clientId
  const clientId = role === 'ADMIN'
    ? new URL(request.url).searchParams.get('clientId')
    : sessionClientId

  if (!clientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const goals = await prisma.goal.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(goals)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const sessionClientId = (session.user as any).clientId
  const { clientId, metric, target, period, label } = await request.json()

  const resolvedClientId = role === 'ADMIN' ? clientId : sessionClientId
  if (!resolvedClientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  try {
    const goal = await prisma.goal.create({
      data: { clientId: resolvedClientId, metric, target: parseFloat(target), period, label }
    })
    return NextResponse.json(goal, { status: 201 })
  } catch(e: any) {
    console.error('Goal create error:', e.message, e.code)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
