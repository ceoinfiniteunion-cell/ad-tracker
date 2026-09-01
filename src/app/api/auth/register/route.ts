import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, getIp, isValidEmail, isValidPassword, sanitizeString } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 реєстрації з одного IP за годину
    const ip = getIp(request)
    const { ok } = await rateLimit(`register:${ip}`, 3, 60 * 60 * 1000)
    if (!ok) {
      return NextResponse.json({ error: 'Забагато спроб реєстрації. Спробуйте через годину.' }, { status: 429 })
    }

    const body = await request.json()
    const { name, email, password, company, phone } = body

    // Валідація
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Заповніть всі обовязкові поля' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Невірний формат email' }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: 'Пароль має бути від 6 до 128 символів' }, { status: 400 })
    }

    const cleanName = sanitizeString(name, 100)
    const cleanCompany = sanitizeString(company, 200)
    const cleanPhone = sanitizeString(phone, 20)
    const cleanEmail = email.toLowerCase().trim()

    if (cleanName.length < 2) {
      return NextResponse.json({ error: "Ім&apos;я має бути мінімум 2 символи" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) {
      // Не розкриваємо чи email існує — повертаємо той самий відповідь
      return NextResponse.json({ success: true })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        company: cleanCompany || null,
        phone: cleanPhone || null,
        role: 'CLIENT',
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[REGISTER ERROR]', e)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
