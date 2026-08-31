import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/lib/auth'
import { blacklistToken } from '@/lib/jwt-blacklist'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (token?.jti && token?.exp) {
    await blacklistToken(token.jti as string, token.exp as number)
    await prisma.auditLog.create({
      data: { action: 'LOGOUT', userId: (session.user as any).id ?? 'unknown', meta: { email: session.user?.email } }
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
