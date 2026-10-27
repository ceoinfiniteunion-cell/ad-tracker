import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirectWithOAuthState } from '@/lib/oauth-state'

export async function GET() {
  const session = await getServerSession(authOptions)
  const baseUrl = process.env.NEXTAUTH_URL!
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  const appId = process.env.TIKTOK_APP_ID!
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/tiktok/callback`)

  return redirectWithOAuthState('tiktok', (state) =>
    `https://business-api.tiktok.com/portal/auth?app_id=${appId}&redirect_uri=${redirectUri}&state=${state}&rid=tiktok`
  )
}
