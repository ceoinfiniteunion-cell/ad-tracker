import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: { id: true, name: true, email: true, company: true, phone: true, status: true, createdAt: true, client: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { userId, action } = await request.json()
  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (action === 'approve') {
    const user = await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } })
    const existingClient = await prisma.client.findUnique({ where: { userId } })
    if (!existingClient) {
      await prisma.client.create({ data: { name: user.name, company: user.company || user.name, userId: user.id } })
    }
  } else {
    await prisma.user.update({ where: { id: userId }, data: { status: 'REJECTED' } })
  }
  return NextResponse.json({ success: true })
}
