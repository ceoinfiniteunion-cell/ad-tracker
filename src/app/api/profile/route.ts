import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id:true, name:true, email:true, role:true, createdAt:true, client: { select: { company:true } } }
  })
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, currentPassword, newPassword } = await request.json()
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData: any = {}
  if (name && name !== user.name) updateData.name = name

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Введіть поточний пароль' }, { status: 400 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Поточний пароль невірний' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ error: 'Новий пароль — мінімум 8 символів' }, { status: 400 })
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(updateData).length === 0) return NextResponse.json({ error: 'Немає змін' }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id:true, name:true, email:true, role:true }
  })
  return NextResponse.json(updated)
}
