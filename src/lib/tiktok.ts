const TIKTOK_API_VERSION = 'v1.3'
const BASE_URL = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`

async function tiktokFetch(path: string, params: Record<string, string> = {}, accessToken: string) {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`TikTok API: ${data.message} (code: ${data.code})`)
  return data.data
}

export async function getTikTokAdAccounts(accessToken: string): Promise<any[]> {
  const data = await tiktokFetch('/oauth2/advertiser/get/', {}, accessToken)
  return data.list ?? []
}

export async function getTikTokInsights(
  advertiserId: string,
  from: string,
  to: string,
  accessToken: string
): Promise<any[]> {
  const data = await tiktokFetch('/report/integrated/get/', {
    advertiser_id: advertiserId,
    report_type: 'BASIC',
    data_level: 'AUCTION_ADVERTISER',
    dimensions: JSON.stringify(['stat_time_day']),
    metrics: JSON.stringify([
      'spend', 'impressions', 'clicks', 'conversion_rate',
      'ctr', 'cpc', 'cpm', 'reach', 'frequency',
      'video_play_actions', 'video_watched_2s', 'video_watched_6s',
      'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100',
      'profile_visits', 'likes', 'comments', 'shares', 'follows',
      'cost_per_conversion', 'real_time_conversion', 'result', 'cost_per_result',
    ]),
    start_date: from,
    end_date: to,
    page_size: '1000',
  }, accessToken)
  return data.list ?? []
}

export interface TikTokDiscoveredAccount { externalId: string; name: string; currency?: string }

// Назви кабінетів для advertiser_ids з OAuth-відповіді (API приймає до 100 id за запит)
export async function discoverTikTokAccounts(advertiserIds: string[], accessToken: string): Promise<TikTokDiscoveredAccount[]> {
  const accounts: TikTokDiscoveredAccount[] = []
  for (let i = 0; i < advertiserIds.length; i += 100) {
    const batch = advertiserIds.slice(i, i + 100)
    const data = await tiktokFetch('/advertiser/info/', {
      advertiser_ids: JSON.stringify(batch),
      fields: JSON.stringify(['advertiser_id', 'name', 'currency', 'status']),
    }, accessToken)
    const byId = new Map<string, any>((data.list ?? []).map((a: any) => [String(a.advertiser_id), a]))
    for (const id of batch) {
      const info = byId.get(id)
      if (info?.status === 'STATUS_DISABLE') continue
      accounts.push({ externalId: id, name: info?.name || `TikTok Ads ${id}`, currency: info?.currency })
    }
  }
  return accounts
}
