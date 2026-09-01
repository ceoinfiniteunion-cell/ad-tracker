import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user?.twoFactorCode || !user.twoFactorExpiry) return NextResponse.json({ error: 'Код не знайдено. Запросіть новий.' }, { status: 400 })
  if (new Date() > user.twoFactorExpiry) return NextResponse.json({ error: 'Код прострочено. Запросіть новий.' }, { status: 400 })
  if (user.twoFactorCode !== code.trim()) return NextResponse.json({ error: 'Невірний код.' }, { status: 400 })
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { twoFactorCode: null, twoFactorExpiry: null } })
  return NextResponse.json({ ok: true })
}
