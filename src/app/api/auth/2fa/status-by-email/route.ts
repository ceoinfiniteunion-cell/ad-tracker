import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { loginAttempts } from '@/lib/login-attempts'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { ok } = await rateLimit(`2fa-status:${ip}`, 10, 5 * 60 * 1000)
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const emailLower = email.toLowerCase().trim()
  const { blocked, minsLeft } = await loginAttempts.isBlocked(emailLower)
  if (blocked) return NextResponse.json({ error: `Акаунт тимчасово заблоковано. Спробуйте через ${minsLeft} хв.` }, { status: 429 })

  const user = await prisma.user.findUnique({ where: { email: emailLower } })
  if (!user?.password) {
    await loginAttempts.recordFail(emailLower)
    return NextResponse.json({ error: 'Невірний email або пароль' }, { status: 401 })
  }
  if ((user as any).status === 'PENDING') return NextResponse.json({ error: 'Ваша заявка ще на розгляді.' }, { status: 403 })
  if ((user as any).status === 'REJECTED') return NextResponse.json({ error: 'Ваш акаунт відхилено.' }, { status: 403 })

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    await loginAttempts.recordFail(emailLower)
    return NextResponse.json({ error: 'Невірний email або пароль' }, { status: 401 })
  }

  await loginAttempts.reset(emailLower)
  return NextResponse.json({ ok: true, requires2FA: user.twoFactorEnabled === true })
}
