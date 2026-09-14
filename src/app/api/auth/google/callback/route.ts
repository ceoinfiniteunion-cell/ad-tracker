import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveToken, getToken } from '@/lib/token-store'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get('google_oauth_state')?.value

  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(`${baseUrl}/connect?error=invalid_state`)
  }
  if (!code) return NextResponse.redirect(`${baseUrl}/connect?error=no_code`)

  const gClientId = process.env.GOOGLE_CLIENT_ID!
  const gClientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = baseUrl + '/api/auth/google/callback'

  try {
    // 1. Отримуємо токени
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: gClientId,
        client_secret: gClientSecret,
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

    // 2. Шукаємо або створюємо adAccount
    let adAccount = await prisma.adAccount.findFirst({
      where: { clientId: clientId2, platform: 'GOOGLE' },
    })

    if (!adAccount) {
      adAccount = await prisma.adAccount.create({
        data: {
          clientId: clientId2,
          name: 'Google Ads',
          accountId: 'pending',
          platform: 'GOOGLE',
          isActive: true,
        },
      })
    }

    // 3. Зберігаємо токен
    await saveToken(adAccount.id, tokens.access_token, tokens.refresh_token)
    await prisma.adAccount.update({ where: { id: adAccount.id }, data: { tokenStatus: 'valid' } })
    console.log('[GOOGLE OAUTH] Token saved for:', adAccount.id)

    // 4. Отримуємо Customer ID через refresh token (свіжий access token)
    try {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: gClientId,
          client_secret: gClientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      const refreshData = await refreshRes.json()
      const freshAccessToken = refreshData.access_token

      if (freshAccessToken) {
        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
        const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

        const listRes = await fetch(
          'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
          {
            headers: {
              'Authorization': `Bearer ${freshAccessToken}`,
              'developer-token': devToken,
              ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
            },
          }
        )

        const listText = await listRes.text()
        console.log('[GOOGLE OAUTH] Customer list response:', listText.slice(0, 200))

        const listData = JSON.parse(listText)
        if (listData.resourceNames && listData.resourceNames.length > 0) {
          const customerId = listData.resourceNames[0].replace('customers/', '')
          await prisma.adAccount.update({
            where: { id: adAccount.id },
            data: {
              accountId: customerId,
              name: `Google Ads ${customerId}`,
              tokenStatus: 'valid',
            },
          })
          console.log('[GOOGLE OAUTH] Customer ID set:', customerId)
        }
      }
    } catch (e) {
      console.error('[GOOGLE OAUTH] Could not fetch customer ID:', e)
    }

    const response = NextResponse.redirect(`${baseUrl}/connect?success=google`)
    response.cookies.delete('google_oauth_state')
    return response
  } catch (e) {
    console.error('[GOOGLE OAUTH] Error:', e)
    return NextResponse.redirect(`${baseUrl}/connect?error=server_error`)
  }
}
