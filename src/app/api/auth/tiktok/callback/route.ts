import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isValidOAuthState, oauthCallbackRedirect } from '@/lib/oauth-state'
import { discoverTikTokAccounts } from '@/lib/tiktok'
import { handleDiscovered } from '@/lib/ad-connect'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const redirect = (url: string) => oauthCallbackRedirect('tiktok', url)
  const fail = (error: string, msg?: string) =>
    redirect(`${baseUrl}/connect?error=${error}&platform=tiktok${msg ? `&msg=${encodeURIComponent(msg)}` : ''}`)

  const session = await getServerSession(authOptions)
  if (!session) return redirect(`${baseUrl}/auth/login`)
  if (!isValidOAuthState(request, 'tiktok')) return fail('invalid_state')

  const authCode = request.nextUrl.searchParams.get('auth_code')
  if (!authCode) return fail('no_code')

  const clientId = (session.user as any).clientId
  if (!clientId) return fail('no_client')

  try {
    const tokenData = await (await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: process.env.TIKTOK_APP_ID, secret: process.env.TIKTOK_APP_SECRET, auth_code: authCode }),
    })).json()

    const accessToken: string | undefined = tokenData.data?.access_token
    if (tokenData.code !== 0 || !accessToken) {
      console.error('[TIKTOK OAUTH] Token error:', tokenData.code, tokenData.message)
      return fail('token_failed', tokenData.message)
    }

    const advertiserIds: string[] = (tokenData.data?.advertiser_ids ?? []).map(String)
    const accounts = await discoverTikTokAccounts(advertiserIds, accessToken)
    const url = await handleDiscovered(baseUrl, (session.user as any).id, clientId, 'TIKTOK', { accessToken }, accounts)
    return redirect(url)
  } catch (e) {
    console.error('[TIKTOK OAUTH] Error:', e)
    return fail('failed', (e as Error).message)
  }
}
