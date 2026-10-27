import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { consumeTwoFactorCode, TWO_FACTOR_ERRORS } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = getIp(request)
  const userId = (session.user as any).id

  const ipLimit = await rateLimit(`2fa:ip:${ip}`, 5, 15 * 60 * 1000)
  if (!ipLimit.ok) return NextResponse.json({ error: 'Забагато спроб. Спробуйте через 15 хвилин.' }, { status: 429 })

  const userLimit = await rateLimit(`2fa:user:${userId}`, 5, 15 * 60 * 1000)
  if (!userLimit.ok) return NextResponse.json({ error: 'Забагато спроб. Спробуйте через 15 хвилин.' }, { status: 429 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { code, action } = body

  if (!code || typeof code !== 'string') return NextResponse.json({ error: 'Код обовязковий' }, { status: 400 })

  if (action !== 'enable' && action !== 'disable') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const check = await consumeTwoFactorCode(userId, code)
  if (check !== 'ok') return NextResponse.json({ error: TWO_FACTOR_ERRORS[check] }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: action === 'enable' },
    select: { twoFactorEnabled: true },
  })
  return NextResponse.json({ ok: true, twoFactorEnabled: updated.twoFactorEnabled })
}
