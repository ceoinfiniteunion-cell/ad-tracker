import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isValidOAuthState, oauthCallbackRedirect } from '@/lib/oauth-state'
import { discoverMetaAccounts } from '@/lib/meta'
import { handleDiscovered } from '@/lib/ad-connect'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const redirect = (url: string) => oauthCallbackRedirect('meta', url)
  const fail = (error: string, msg?: string) =>
    redirect(`${baseUrl}/connect?error=${error}&platform=meta${msg ? `&msg=${encodeURIComponent(msg)}` : ''}`)

  const session = await getServerSession(authOptions)
  if (!session) return redirect(`${baseUrl}/auth/login`)
  if (!isValidOAuthState(request, 'meta')) return fail('invalid_state')

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return fail('no_code')

  const clientId = (session.user as any).clientId
  if (!clientId) return fail('no_client')

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  try {
    const tokens = await (await fetch(
      'https://graph.facebook.com/v19.0/oauth/access_token?' +
      new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: baseUrl + '/api/auth/meta/callback', code })
    )).json()
    if (!tokens.access_token) return fail('token_failed', tokens.error?.message)

    // Довгостроковий токен (60 днів)
    const longToken = await (await fetch(
      'https://graph.facebook.com/v19.0/oauth/access_token?' +
      new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: tokens.access_token })
    )).json()
    const accessToken: string = longToken.access_token ?? tokens.access_token

    const accounts = await discoverMetaAccounts(accessToken)
    const url = await handleDiscovered(baseUrl, (session.user as any).id, clientId, 'FACEBOOK', { accessToken }, accounts)
    return redirect(url)
  } catch (e) {
    console.error('[META OAUTH] Error:', e)
    return fail('failed', (e as Error).message)
  }
}
