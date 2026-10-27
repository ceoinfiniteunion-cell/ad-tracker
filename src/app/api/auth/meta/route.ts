import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirectWithOAuthState } from '@/lib/oauth-state'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  return redirectWithOAuthState('meta', (state) => {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: baseUrl + '/api/auth/meta/callback',
      scope: 'ads_read,ads_management,business_management',
      response_type: 'code',
      state,
    })
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  })
}
