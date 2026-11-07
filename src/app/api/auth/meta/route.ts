import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirectWithOAuthState } from '@/lib/oauth-state'
import { META_API_VERSION } from '@/lib/meta'

// Facebook Login for Business: дозволи задаються конфігурацією (config_id), scope не передається
export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  // Терпимо випадкові <> або пробіли навколо ID у змінній оточення
  const configId = (process.env.META_CONFIG_ID ?? '').replace(/[<>\s]/g, '')
  if (!/^\d+$/.test(configId)) {
    console.error('[META OAUTH] META_CONFIG_ID is missing or not numeric')
    return NextResponse.redirect(`${baseUrl}/connect?error=failed&platform=meta&msg=${encodeURIComponent('Meta не налаштовано: відсутній META_CONFIG_ID')}`)
  }

  return redirectWithOAuthState('meta', (state) => {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: baseUrl + '/api/auth/meta/callback',
      config_id: configId,
      response_type: 'code',
      // Обовʼязково для конфігурацій з токеном system user; для токена користувача — примушує code flow
      override_default_response_type: 'true',
      state,
    })
    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`
  })
}
