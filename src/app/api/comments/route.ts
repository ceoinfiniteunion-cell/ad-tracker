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
  const comments = await prisma.comment.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { clientId, text, period } = await request.json()
  if (!clientId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const cleanText = sanitizeString(text, 1000)
  if (cleanText.length < 1) return NextResponse.json({ error: 'Text too short' }, { status: 400 })

  // Перевірка що clientId існує
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const comment = await prisma.comment.create({
    data: {
      clientId,
      authorId: (session.user as any).id ?? 'admin',
      text: cleanText,
      period: period ? sanitizeString(period, 50) : null,
    }
  })
  return NextResponse.json(comment, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.comment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
