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
  const url = 'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers'
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
      ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
      : {}),
  }
  console.log('[GoogleAds] listAccessibleCustomers URL:', url)
  console.log('[GoogleAds] headers sent:', {
    Authorization: 'Bearer [REDACTED]',
    'developer-token': headers['developer-token'] ? '[SET]' : '[MISSING]',
    ...(headers['login-customer-id'] ? { 'login-customer-id': headers['login-customer-id'] } : {}),
  })
  const res = await fetch(url, { headers })
  const text = await res.text()
  console.log('[GoogleAds] listAccessibleCustomers status:', res.status)
  console.log('[GoogleAds] listAccessibleCustomers response:', text)
  let data: any
  try { data = JSON.parse(text) } catch (e) { throw new Error('Google API non-JSON: ' + text) }
  if (data.error) throw new Error(JSON.stringify(data.error))
  return data.resourceNames ?? []
}

export async function getGoogleAdsCampaignMetrics(
  accessToken: string,
  customerId: string,
  from: string,
  to: string
): Promise<any[]> {
  const cleanId = customerId.replace('customers/', '').replace(/-/g, '')
  const url = `https://googleads.googleapis.com/v22/customers/${cleanId}/googleAds:search`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    'Content-Type': 'application/json',
  }
  console.log('[GoogleAds] search URL:', url)
  console.log('[GoogleAds] headers sent:', {
    Authorization: 'Bearer [REDACTED]',
    'developer-token': headers['developer-token'] ? '[SET]' : '[MISSING]',
    'Content-Type': headers['Content-Type'],
  })
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
      campaign.name,
      campaign.status
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date ASC
  `
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  console.log('[GoogleAds] search status:', res.status)
  console.log('[GoogleAds] search response:', text)
  let data: any
  try { data = JSON.parse(text) } catch (e) { throw new Error('Google API non-JSON: ' + text) }
  if (data.error) throw new Error(JSON.stringify(data.error))
  return data.results ?? []
}
