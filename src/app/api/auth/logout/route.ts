import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { blacklistToken } from '@/lib/jwt-blacklist'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const jti = (session.user as any).jti
      if (jti) {
        // Blacklist токен на 24 години
        const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60
        await blacklistToken(jti, expiresAt)
      }
    }
  } catch {}
  return NextResponse.json({ ok: true })
}
