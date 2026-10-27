import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, timingSafeEqual } from 'crypto'

type Provider = 'google' | 'meta' | 'tiktok'

const cookieName = (provider: Provider) => `${provider}_oauth_state`

// Редірект на OAuth-провайдера з одноразовим state у httpOnly cookie (захист від CSRF)
export function redirectWithOAuthState(provider: Provider, buildUrl: (state: string) => string): NextResponse {
  const state = randomBytes(32).toString('hex')
  const response = NextResponse.redirect(buildUrl(state))
  response.cookies.set(cookieName(provider), state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })
  return response
}

export function isValidOAuthState(request: NextRequest, provider: Provider): boolean {
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get(cookieName(provider))?.value
  if (!state || !cookieState) return false
  const a = Buffer.from(state)
  const b = Buffer.from(cookieState)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Redirect з callback, який гасить state cookie
export function oauthCallbackRedirect(provider: Provider, url: string): NextResponse {
  const response = NextResponse.redirect(url)
  response.cookies.delete(cookieName(provider))
  return response
}
