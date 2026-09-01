import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { loginAttempts } from '@/lib/login-attempts'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const emailLower = email.toLowerCase().trim()

  // Перевірка блокування
  const { blocked, minsLeft } = await loginAttempts.isBlocked(emailLower)
  if (blocked) {
    return NextResponse.json({ error: `Акаунт тимчасово заблоковано. Спробуйте через ${minsLeft} хв.` })
  }

  const user = await prisma.user.findUnique({ where: { email: emailLower } })
  if (!user?.password) {
    await loginAttempts.recordFail(emailLower)
    return NextResponse.json({ error: 'Невірний email або пароль' })
  }

  if ((user as any).status === 'PENDING') return NextResponse.json({ error: 'Ваша заявка ще на розгляді.' })
  if ((user as any).status === 'REJECTED') return NextResponse.json({ error: 'Ваш акаунт відхилено.' })

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    await loginAttempts.recordFail(emailLower)
    return NextResponse.json({ error: 'Невірний email або пароль' })
  }

  await loginAttempts.reset(emailLower)

  return NextResponse.json({ 
    ok: true,
    requires2FA: (user as any).twoFactorEnabled === true
  })
}
