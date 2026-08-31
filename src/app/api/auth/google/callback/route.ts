import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveToken } from '@/lib/token-store'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get('google_oauth_state')?.value

  if (!state || !cookieState || state !== cookieState) {
    console.error('[GOOGLE OAUTH] State mismatch — possible CSRF attack')
    return NextResponse.redirect(`${baseUrl}/connect?error=invalid_state`)
  }

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
      signal: AbortSignal.timeout(10000),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) {
      console.error('[GOOGLE OAUTH] Token error:', tokens.error)
      return NextResponse.redirect(`${baseUrl}/connect?error=token_failed`)
    }

    const clientId2 = (session.user as any).clientId
    if (!clientId2) return NextResponse.redirect(`${baseUrl}/connect?error=no_client`)

    const adAccount = await prisma.adAccount.findFirst({
      where: { clientId: clientId2, platform: 'GOOGLE' },
    })

    if (adAccount && tokens.access_token) {
      await saveToken(adAccount.id, tokens.access_token, tokens.refresh_token)
    }

    const response = NextResponse.redirect(`${baseUrl}/connect?success=google`)
    response.cookies.delete('google_oauth_state')
    return response
  } catch (e) {
    console.error('[GOOGLE OAUTH] Error:', e)
    return NextResponse.redirect(`${baseUrl}/connect?error=server_error`)
  }
}
