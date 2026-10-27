import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sealToken } from '@/lib/token-store'
import { isValidOAuthState, oauthCallbackRedirect } from '@/lib/oauth-state'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL!
  const session = await getServerSession(authOptions)
  if (!session) return oauthCallbackRedirect('tiktok', `${baseUrl}/auth/login`)

  if (!isValidOAuthState(request, 'tiktok')) {
    return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=invalid_state`)
  }

  const authCode = request.nextUrl.searchParams.get('auth_code')
  if (!authCode) return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=no_code&platform=tiktok`)

  const appId = process.env.TIKTOK_APP_ID!
  const appSecret = process.env.TIKTOK_APP_SECRET!

  try {
    // Міняємо auth_code на access_token
    const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: authCode }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.code !== 0) console.error('[TIKTOK OAUTH] Token error:', tokenData.code, tokenData.message)

    if (tokenData.code !== 0) {
      return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=token_failed&msg=${encodeURIComponent(tokenData.message)}&platform=tiktok`)
    }

    const accessToken = tokenData.data?.access_token
    const advertiserIds: string[] = tokenData.data?.advertiser_ids ?? []

    if (!accessToken) {
      return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=no_token&platform=tiktok`)
    }

    const clientId = (session.user as any).clientId
    if (!clientId) return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=no_client_id`)

    const sealedToken = sealToken(accessToken)

    // Отримуємо інфо про кожен advertiser
    let savedCount = 0
    for (const advertiserId of advertiserIds) {
      try {
        // Отримуємо назву акаунту
        const infoRes = await fetch(
          `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=${JSON.stringify([advertiserId])}`,
          { headers: { 'Access-Token': accessToken } }
        )
        const infoData = await infoRes.json()
        const advertiserInfo = infoData.data?.list?.[0]
        const name = advertiserInfo?.advertiser_name ?? `TikTok Ads ${advertiserId}`

        const existing = await prisma.adAccount.findFirst({
          where: { clientId, platform: 'TIKTOK', accountId: advertiserId }
        })

        if (existing) {
          await prisma.adAccount.update({
            where: { id: existing.id },
            data: { accessToken: sealedToken, tokenStatus: 'valid', isActive: true, name }
          })
        } else {
          await prisma.adAccount.create({
            data: {
              clientId,
              platform: 'TIKTOK',
              accountId: advertiserId,
              name,
              accessToken: sealedToken,
              tokenStatus: 'active',
              isActive: true,
            }
          })
        }
        savedCount++
      } catch (dbErr: any) {
        console.error('TikTok DB error for advertiser', advertiserId, dbErr.message)
      }
    }

    return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?success=tiktok&accounts=${savedCount}`)
  } catch (e: any) {
    console.error('TikTok callback error:', e)
    return oauthCallbackRedirect('tiktok', `${baseUrl}/connect?error=failed&msg=${encodeURIComponent(e.message)}&platform=tiktok`)
  }
}
