import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${baseUrl}/connect?error=no_code`)

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = baseUrl + '/api/auth/google/callback'

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
    if (!tokens.access_token) return NextResponse.redirect(`${baseUrl}/connect?error=no_token`)

    const clientId2 = (session.user as any).clientId

    // upsert — оновлює якщо вже є, створює якщо немає
    const existing = await prisma.adAccount.findFirst({
      where: { clientId: clientId2, platform: 'GOOGLE' }
    })

    if (existing) {
      await prisma.adAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? existing.refreshToken,
          tokenStatus: 'active',
          isActive: true,
        }
      })
    } else {
      await prisma.adAccount.create({
        data: {
          clientId: clientId2,
          platform: 'GOOGLE',
          accountId: 'google_oauth',
          name: 'Google Ads (OAuth)',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenStatus: 'active',
          isActive: true,
        }
      })
    }

    return NextResponse.redirect(`${baseUrl}/connect?success=google`)
  } catch (e: any) {
    console.error('Google callback error:', e)
    return NextResponse.redirect(`${baseUrl}/connect?error=failed`)
  }
}
