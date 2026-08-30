import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const { success } = rateLimit(ip, 5, 15 * 60 * 1000)
    if (!success) {
      return NextResponse.json({ error: 'Забагато спроб. Спробуйте через 15 хвилин.' }, { status: 429 })
    }

    const { name, email, password, company, phone } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Заповніть всі обовязкові поля' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль має бути мінімум 6 символів' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Цей email вже зареєстрований' }, { status: 400 })
    }
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { name, email, password: hashedPassword, company: company || null, phone: phone || null, role: 'CLIENT', status: 'PENDING' },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
