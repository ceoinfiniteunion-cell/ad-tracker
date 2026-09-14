import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveToken } from '@/lib/token-store'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(`${baseUrl}/auth/login`)

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieState = request.cookies.get('google_oauth_state')?.value

  if (!state || !cookieState || state !== cookieState) {
    console.error('[GOOGLE OAUTH] State mismatch')
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

    // 2. Шукаємо існуючий Google акаунт
    let adAccount = await prisma.adAccount.findFirst({
      where: { clientId: clientId2, platform: 'GOOGLE' },
    })

    // 3. Якщо немає — створюємо новий
    if (!adAccount) {
      // Спробуємо отримати Customer ID через Google Ads API
      let customerId = 'unknown'
      let accountName = 'Google Ads'
      try {
        const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
        const listRes = await fetch(
          `https://googleads.googleapis.com/v18/customers:listAccessibleCustomers`,
          {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'developer-token': devToken!,
              ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
            },
          }
        )
        const listData = await listRes.json()
        if (listData.resourceNames && listData.resourceNames.length > 0) {
          // Беремо перший доступний акаунт
          customerId = listData.resourceNames[0].replace('customers/', '')
          accountName = `Google Ads ${customerId}`
        }
      } catch (e) {
        console.error('[GOOGLE OAUTH] Could not fetch customer list:', e)
      }

      adAccount = await prisma.adAccount.create({
        data: {
          clientId: clientId2,
          name: accountName,
          accountId: customerId,
          platform: 'GOOGLE',
          isActive: true,
        },
      })
      console.log('[GOOGLE OAUTH] Created new adAccount:', adAccount.id)
    }

    // 4. Зберігаємо токен
    if (tokens.access_token) {
      await saveToken(adAccount.id, tokens.access_token, tokens.refresh_token)
      console.log('[GOOGLE OAUTH] Token saved for account:', adAccount.id)
    }

    const response = NextResponse.redirect(`${baseUrl}/connect?success=google`)
    response.cookies.delete('google_oauth_state')
    return response
  } catch (e) {
    console.error('[GOOGLE OAUTH] Error:', e)
    return NextResponse.redirect(`${baseUrl}/connect?error=server_error`)
  }
}
