import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTwoFactorCode } from '@/lib/email'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Для профілю — авторизований юзер
    if (session) {
      const userId = (session.user as any).id
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      const code = generateCode()
      const expiry = new Date(Date.now() + 10 * 60 * 1000)

      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorCode: code, twoFactorExpiry: expiry },
      })

      await sendTwoFactorCode(user.email, code, user.name)
      return NextResponse.json({ ok: true, email: user.email })
    }

    // Для логіну — email передається в body
    const body = await request.json().catch(() => ({}))
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) return NextResponse.json({ ok: true }) // не розкриваємо чи існує юзер

    const code = generateCode()
    const expiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: code, twoFactorExpiry: expiry },
    })

    await sendTwoFactorCode(user.email, code, user.name)
    return NextResponse.json({ ok: true, email: user.email })

  } catch (e: any) {
    console.error('[2FA SEND ERROR]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
