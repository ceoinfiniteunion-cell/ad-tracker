const META_API_VERSION = 'v19.0'
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

async function metaFetch(path: string, params: Record<string, string> = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN not set')
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.error) throw new Error(`Meta API: ${data.error.message}`)
  return data
}

export async function getAdAccounts() {
  const data = await metaFetch('/me/adaccounts', {
    fields: 'id,name,account_id,account_status,currency,timezone_name'
  })
  return data.data ?? []
}

export async function getAccountInsights(accountId: string, from: string, to: string) {
  const data = await metaFetch(`/${accountId}/insights`, {
    fields: 'spend,impressions,clicks,actions,action_values,ctr,cpc,cpp,reach,frequency',
    time_range: JSON.stringify({ since: from, until: to }),
    time_increment: '1',
    level: 'account',
  })
  return data.data ?? []
}

export async function getCampaigns(accountId: string, from: string, to: string) {
  const data = await metaFetch(`/${accountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget',
    effective_status: JSON.stringify(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  })
  const campaigns = data.data ?? []

  // Інсайти для кожної кампанії
  const withInsights = await Promise.all(campaigns.map(async (c: any) => {
    try {
      const ins = await metaFetch(`/${c.id}/insights`, {
        fields: 'spend,impressions,clicks,actions,action_values,ctr,cpc',
        time_range: JSON.stringify({ since: from, until: to }),
      })
      return { ...c, insights: ins.data?.[0] ?? null }
    } catch { return { ...c, insights: null } }
  }))
  return withInsights
}

export async function getAdSets(accountId: string, from: string, to: string) {
  const data = await metaFetch(`/${accountId}/adsets`, {
    fields: 'id,name,status,campaign_id,daily_budget,targeting',
    effective_status: JSON.stringify(['ACTIVE', 'PAUSED']),
    limit: '50',
  })
  const adsets = data.data ?? []

  const withInsights = await Promise.all(adsets.map(async (a: any) => {
    try {
      const ins = await metaFetch(`/${a.id}/insights`, {
        fields: 'spend,impressions,clicks,actions,ctr,cpc',
        time_range: JSON.stringify({ since: from, until: to }),
      })
      return { ...a, insights: ins.data?.[0] ?? null }
    } catch { return { ...a, insights: null } }
  }))
  return withInsights
}

export function parseConversions(actions: any[]): number {
  if (!actions) return 0
  const conversionTypes = ['purchase', 'lead', 'complete_registration', 'add_to_cart', 'offsite_conversion.fb_pixel_purchase']
  return actions.filter(a => conversionTypes.includes(a.action_type)).reduce((s, a) => s + Number(a.value), 0)
}

export function parseRevenue(actionValues: any[]): number {
  if (!actionValues) return 0
  return actionValues.filter(a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')
    .reduce((s, a) => s + Number(a.value), 0)
}
