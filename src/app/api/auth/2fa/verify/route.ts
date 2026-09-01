import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, getIp } from '@/lib/rate-limit'

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

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!user.twoFactorCode || !user.twoFactorExpiry) return NextResponse.json({ error: 'Код не було відправлено. Спробуйте знову.' }, { status: 400 })

  if (new Date() > user.twoFactorExpiry) {
    await prisma.user.update({ where: { id: userId }, data: { twoFactorCode: null, twoFactorExpiry: null } })
    return NextResponse.json({ error: 'Код протермінований. Запросіть новий.' }, { status: 400 })
  }

  const expected = user.twoFactorCode
  const received = code.trim()
  if (expected !== received) return NextResponse.json({ error: 'Невірний код' }, { status: 400 })

  const updateData: any = { twoFactorCode: null, twoFactorExpiry: null }
  if (action === 'enable') updateData.twoFactorEnabled = true
  if (action === 'disable') updateData.twoFactorEnabled = false

  const updated = await prisma.user.update({ where: { id: userId }, data: updateData, select: { twoFactorEnabled: true } })
  return NextResponse.json({ ok: true, twoFactorEnabled: updated.twoFactorEnabled })
}
