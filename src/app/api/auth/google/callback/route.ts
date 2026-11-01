import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isValidOAuthState, oauthCallbackRedirect } from '@/lib/oauth-state'
import { discoverGoogleAccounts, GoogleAdsError } from '@/lib/google'
import { handleDiscovered } from '@/lib/ad-connect'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const redirect = (url: string) => oauthCallbackRedirect('google', url)
  const fail = (error: string, msg?: string) =>
    redirect(`${baseUrl}/connect?error=${error}&platform=google${msg ? `&msg=${encodeURIComponent(msg)}` : ''}`)

  const session = await getServerSession(authOptions)
  if (!session) return redirect(`${baseUrl}/auth/login`)
  if (!isValidOAuthState(request, 'google')) return fail('invalid_state')

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return fail('no_code')

  const clientId = (session.user as any).clientId
  if (!clientId) return fail('no_client')

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: baseUrl + '/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10000),
    })
    const tokens = await tokenRes.json()
    if (tokens.error || !tokens.access_token) {
      console.error('[GOOGLE OAUTH] Token error:', tokens.error)
      return fail('token_failed')
    }

    const { accounts, warnings } = await discoverGoogleAccounts(tokens.access_token)
    if (accounts.length === 0 && warnings.length) return fail('no_accounts', warnings.join('\n'))

    const url = await handleDiscovered(baseUrl, (session.user as any).id, clientId, 'GOOGLE',
      { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }, accounts)
    return redirect(url)
  } catch (e) {
    console.error('[GOOGLE OAUTH] Error:', e)
    return fail('failed', e instanceof GoogleAdsError ? e.message : 'Не вдалося отримати кабінети Google Ads')
  }
}
