import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/google/callback'
  )
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials.access_token!
}

export async function getGoogleAdsAccounts(accessToken: string): Promise<any[]> {
  const res = await fetch(
    'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
      },
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.resourceNames ?? []
}

export async function getGoogleAdsCampaignMetrics(
  accessToken: string,
  customerId: string,
  from: string,
  to: string
): Promise<any[]> {
  const cleanId = customerId.replace('customers/', '').replace(/-/g, '')
  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.video_views,
      campaign.name,
      campaign.status
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date ASC
  `
  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${cleanId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
        'Content-Type': 'application/json',
        ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
          ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
          : {}),
      },
      body: JSON.stringify({ query }),
    }
  )
  const text = await res.text()
  console.log('Google Ads raw response:', text.slice(0, 300))
  let data: any
  try { data = JSON.parse(text) } catch(e) { throw new Error('Google API non-JSON: ' + text.slice(0, 200)) }
  if (data.error) throw new Error(JSON.stringify(data.error))
  return data.results ?? []
}
