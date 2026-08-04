import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect('/auth/login')

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect('/connect?error=no_code')

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/google/callback'

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) return NextResponse.redirect('/connect?error=no_token')

    // Зберігаємо токен в БД
    const userId = (session.user as any).id
    const clientId2 = (session.user as any).clientId

    await prisma.adAccount.create({
      data: {
        clientId: clientId2,
        platform: 'GOOGLE',
        accountId: 'google_oauth',
        name: 'Google Ads',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isActive: true,
      }
    })

    return NextResponse.redirect('/connect?success=google')
  } catch (e) {
    return NextResponse.redirect('/connect?error=failed')
  }
}
