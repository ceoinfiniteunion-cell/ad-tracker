import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.NEXTAUTH_URL + '/api/auth/meta/callback'

  const params = new URLSearchParams({
    client_id: appId!,
    redirect_uri: redirectUri,
    scope: 'ads_read,ads_management,business_management',
    response_type: 'code',
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )
}
