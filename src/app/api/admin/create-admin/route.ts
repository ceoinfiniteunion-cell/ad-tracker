import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserStatus, Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Всі поля обовʼязкові' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Пароль мінімум 8 символів' }, { status: 400 })
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Користувач з таким email вже існує' }, { status: 400 })
  }
  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    }
  })
  return NextResponse.json({ id: user.id, email: user.email, name: user.name })
}
