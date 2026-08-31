import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeString } from '@/lib/api-security'

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
  const body = await request.json()
  const { clientId, metric, target, period, label } = body

  const resolvedClientId = role === 'ADMIN' ? clientId : sessionClientId
  if (!resolvedClientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (!metric || !target || !period) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const parsedTarget = parseFloat(target)
  if (isNaN(parsedTarget) || parsedTarget < 0) {
    return NextResponse.json({ error: 'Invalid target value' }, { status: 400 })
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        clientId: resolvedClientId,
        metric: sanitizeString(metric, 50),
        target: parsedTarget,
        period: sanitizeString(period, 20),
        label: label ? sanitizeString(label, 100) : null,
      }
    })
    return NextResponse.json(goal, { status: 201 })
  } catch(e: any) {
    console.error('Goal create error:', e.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const sessionClientId = (session.user as any).clientId
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const goal = await prisma.goal.findUnique({ where: { id } })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Ownership check — CLIENT може видаляти тільки свої goals
  if (role !== 'ADMIN' && goal.clientId !== sessionClientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.goal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
