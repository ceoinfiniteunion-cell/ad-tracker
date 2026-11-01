import { google } from 'googleapis'

const GOOGLE_ADS_API_VERSION = 'v26'
const BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

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

// Помилка Google Ads API з повідомленням, яке можна показати користувачу
export class GoogleAdsError extends Error {
  constructor(message: string, public code: string, public fatal: boolean) {
    super(message)
  }
}

const FRIENDLY: Record<string, { message: string; fatal: boolean }> = {
  DEVELOPER_TOKEN_NOT_APPROVED: {
    message: 'Developer token Google Ads має тестовий рівень доступу і працює лише з тестовими кабінетами. Потрібен Basic access в Google Ads API Center.',
    fatal: true,
  },
  DEVELOPER_TOKEN_PROHIBITED: { message: 'Developer token Google Ads заблоковано для цього проєкту Google Cloud.', fatal: true },
  DEVELOPER_TOKEN_NOT_ON_ALLOWLIST: { message: 'Developer token Google Ads не має доступу до цієї функції API.', fatal: true },
  USER_PERMISSION_DENIED: { message: 'Ваш Google-акаунт не має доступу до цього кабінету Google Ads.', fatal: false },
  CUSTOMER_NOT_ENABLED: { message: 'Кабінет Google Ads неактивний (скасований або призупинений).', fatal: false },
  NOT_ADS_USER: { message: 'Цей Google-акаунт не має жодного кабінету Google Ads.', fatal: true },
  OAUTH_TOKEN_INVALID: { message: 'Авторизація Google недійсна. Підключіть Google Ads ще раз.', fatal: true },
  OAUTH_TOKEN_EXPIRED: { message: 'Авторизація Google протермінована. Підключіть Google Ads ще раз.', fatal: true },
  RESOURCE_EXHAUSTED: { message: 'Перевищено ліміт запитів Google Ads API. Спробуйте пізніше.', fatal: true },
  UNSUPPORTED_VERSION: { message: 'Версія Google Ads API застаріла — потрібне оновлення сервісу.', fatal: true },
}

function toGoogleAdsError(status: number, body: any): GoogleAdsError {
  const first = body?.error?.details?.find((d: any) => d.errors)?.errors?.[0]
  const code = first?.errorCode ? String(Object.values(first.errorCode)[0]) : String(body?.error?.status ?? status)
  const known = FRIENDLY[code]
  console.error('[GoogleAds] API error', status, code, first?.message ?? body?.error?.message)
  if (known) return new GoogleAdsError(known.message, code, known.fatal)
  return new GoogleAdsError(`Google Ads API: ${first?.message ?? body?.error?.message ?? `HTTP ${status}`}`, code, false)
}

async function adsRequest(path: string, accessToken: string, init: { body?: unknown; loginCustomerId?: string | null } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
      'Content-Type': 'application/json',
      ...(init.loginCustomerId ? { 'login-customer-id': init.loginCustomerId } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { throw new GoogleAdsError('Google Ads API повернув некоректну відповідь.', 'NON_JSON', false) }
  if (!res.ok || data.error) throw toGoogleAdsError(res.status, data)
  return data
}

async function search(customerId: string, query: string, accessToken: string, loginCustomerId?: string | null): Promise<any[]> {
  const rows: any[] = []
  let pageToken: string | undefined
  do {
    const data = await adsRequest(`/customers/${customerId}/googleAds:search`, accessToken, {
      body: { query, ...(pageToken ? { pageToken } : {}) },
      loginCustomerId,
    })
    rows.push(...(data.results ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return rows
}

export async function getGoogleAdsAccounts(accessToken: string): Promise<string[]> {
  const data = await adsRequest('/customers:listAccessibleCustomers', accessToken)
  return data.resourceNames ?? []
}

export interface GoogleDiscoveredAccount {
  externalId: string
  name: string
  currency?: string
  loginCustomerId: string | null
}

// Всі робочі (не MCC) кабінети, доступні користувачу. Кабінети під MCC беруться як його дочірні.
export async function discoverGoogleAccounts(accessToken: string): Promise<{ accounts: GoogleDiscoveredAccount[]; warnings: string[] }> {
  const ids = (await getGoogleAdsAccounts(accessToken)).map(rn => rn.replace('customers/', ''))
  const found = new Map<string, GoogleDiscoveredAccount>()
  const warnings: string[] = []

  for (const id of ids) {
    try {
      const [row] = await search(id,
        'SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code, customer.status FROM customer LIMIT 1',
        accessToken, id)
      const c = row?.customer
      if (!c || c.status !== 'ENABLED') continue

      if (!c.manager) {
        found.set(id, { externalId: id, name: c.descriptiveName || `Google Ads ${id}`, currency: c.currencyCode, loginCustomerId: null })
        continue
      }

      // MCC — сам не додаємо, беремо його активні дочірні кабінети
      const children = await search(id,
        "SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code FROM customer_client WHERE customer_client.manager = FALSE AND customer_client.status = 'ENABLED'",
        accessToken, id)
      for (const ch of children) {
        const cc = ch.customerClient
        const childId = String(cc?.id ?? '')
        if (!childId || found.has(childId)) continue
        found.set(childId, { externalId: childId, name: cc.descriptiveName || `Google Ads ${childId}`, currency: cc.currencyCode, loginCustomerId: id })
      }
    } catch (e) {
      if (e instanceof GoogleAdsError && e.fatal) throw e
      if (e instanceof GoogleAdsError && e.code === 'CUSTOMER_NOT_ENABLED') continue
      warnings.push(`${id}: ${(e as Error).message}`)
    }
  }

  return { accounts: Array.from(found.values()), warnings }
}

export async function getGoogleAdsCampaignMetrics(
  accessToken: string,
  customerId: string,
  from: string,
  to: string,
  loginCustomerId?: string | null
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
      metrics.video_trueview_views,
      campaign.name,
      campaign.status
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date ASC
  `
  return search(cleanId, query, accessToken, loginCustomerId ?? cleanId)
}
