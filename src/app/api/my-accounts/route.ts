import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = (session.user as any).clientId
  if (!clientId) return NextResponse.json({ error: 'Not a client' }, { status: 403 })
  const accounts = await prisma.adAccount.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(accounts)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = (session.user as any).clientId
  if (!clientId) return NextResponse.json({ error: 'Not a client' }, { status: 403 })
  const { name, accountId, platform, accessToken } = await request.json()
  if (!name || !accountId || !platform) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Верифікуємо токен якщо є
  let tokenStatus = 'no_token'
  if (accessToken && platform === 'FACEBOOK') {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/act_${accountId.replace('act_','')}?fields=id,name&access_token=${accessToken}`)
      const d = await res.json()
      tokenStatus = d.error ? 'invalid' : 'valid'
    } catch { tokenStatus = 'invalid' }
  }

  try {
    const account = await prisma.adAccount.create({
      data: { clientId, name, accountId, platform, accessToken: accessToken || null, tokenStatus }
    })
    return NextResponse.json(account, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Кабінет з таким ID вже існує' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
