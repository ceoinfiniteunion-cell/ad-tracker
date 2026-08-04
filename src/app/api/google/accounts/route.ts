import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleAdsAccounts, refreshAccessToken } from '@/lib/google'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const account = await prisma.adAccount.findFirst({
    where: { clientId, platform: 'GOOGLE', isActive: true },
  })
  if (!account?.accessToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 404 })
  }

  try {
    let token = account.accessToken
    if (account.refreshToken) {
      try { token = await refreshAccessToken(account.refreshToken) } catch {}
    }
    const resourceNames = await getGoogleAdsAccounts(token)
    return NextResponse.json({ accounts: resourceNames })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
