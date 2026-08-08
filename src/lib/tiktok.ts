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
    dimensions: JSON.stringify(['stat_time_day']),
    metrics: JSON.stringify([
      'spend', 'impressions', 'clicks', 'conversions', 'conversion_rate',
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
