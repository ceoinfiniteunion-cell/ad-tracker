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

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = baseUrl + '/api/auth/meta/callback'

  try {
    // Міняємо code на токен
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
    )
    const tokens = await tokenRes.json()
    console.log('Meta tokens:', JSON.stringify(tokens))
    if (!tokens.access_token) return NextResponse.redirect(`${baseUrl}/connect?error=no_token&msg=${encodeURIComponent(tokens.error?.message ?? 'no_access_token')}`)

    // Отримуємо довгостроковий токен (60 днів)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: tokens.access_token })
    )
    const longToken = await longTokenRes.json()
    console.log('Meta long token:', JSON.stringify(longToken))
    const accessToken = longToken.access_token ?? tokens.access_token

    // Отримуємо список рекламних акаунтів
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    )
    const accountsData = await accountsRes.json()
    console.log('Meta ad accounts:', JSON.stringify(accountsData))
    const adAccounts = accountsData.data ?? []

    const clientId = (session.user as any).clientId
    if (!clientId) return NextResponse.redirect(`${baseUrl}/connect?error=no_client_id`)

    // Зберігаємо кожен акаунт
    for (const acc of adAccounts) {
      try {
        const existing = await prisma.adAccount.findFirst({
          where: { clientId, platform: 'FACEBOOK', accountId: acc.id }
        })
        if (existing) {
          await prisma.adAccount.update({
            where: { id: existing.id },
            data: { accessToken, tokenStatus: 'active', isActive: true }
          })
        } else {
          await prisma.adAccount.create({
            data: {
              clientId,
              platform: 'FACEBOOK',
              accountId: acc.id,
              name: acc.name ?? 'Meta Ads',
              accessToken,
              tokenStatus: 'active',
              isActive: true,
            }
          })
        }
      } catch (dbErr: any) {
        console.error('DB error for account', acc.id, dbErr.message)
      }
    }

    return NextResponse.redirect(`${baseUrl}/connect?success=meta&accounts=${adAccounts.length}`)
  } catch (e: any) {
    console.error('Meta callback error:', e)
    return NextResponse.redirect(`${baseUrl}/connect?error=failed&msg=${encodeURIComponent(e.message)}`)
  }
}
