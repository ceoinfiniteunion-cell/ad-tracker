import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issueTwoFactorCode } from '@/lib/two-factor'

// Тільки для профілю (увімкнення/вимкнення 2FA). При логіні код шле authorize().
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { ok } = await issueTwoFactorCode(user)
    if (!ok) return NextResponse.json({ error: 'Забагато запитів коду. Спробуйте через 10 хвилин.' }, { status: 429 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[2FA SEND ERROR]', e)
    return NextResponse.json({ error: 'Помилка відправки коду' }, { status: 500 })
  }
}
