const META_API_VERSION = 'v19.0'
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

async function metaFetch(path: string, params: Record<string, string> = {}) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) throw new Error('META_ACCESS_TOKEN not set')
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { cache: 'no-store' })
  const data = await res.json()
  if (data.error) throw new Error(`Meta API: ${data.error.message}`)
  return data
}

export async function getAdAccounts() {
  const data = await metaFetch('/me/adaccounts', {
    fields: 'id,name,account_id,account_status,currency,timezone_name,amount_spent'
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
  // Без effective_status фільтра — беремо все
  const data = await metaFetch(`/${accountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget',
    limit: '100',
  })
  const campaigns = data.data ?? []

  const withInsights = await Promise.all(campaigns.map(async (c: any) => {
    try {
      const ins = await metaFetch(`/${c.id}/insights`, {
        fields: 'spend,impressions,clicks,reach,frequency,ctr,cpc,cpp,actions,action_values,cost_per_action_type',
        time_range: JSON.stringify({ since: from, until: to }),
      })
      return { ...c, insights: ins.data?.[0] ?? null }
    } catch {
      return { ...c, insights: null }
    }
  }))
  return withInsights
}

export async function getAdSets(accountId: string, from: string, to: string) {
  // Без effective_status фільтра
  const data = await metaFetch(`/${accountId}/adsets`, {
    fields: 'id,name,status,campaign_id,daily_budget,optimization_goal,billing_event',
    limit: '200',
  })
  const adsets = data.data ?? []

  const withInsights = await Promise.all(adsets.map(async (a: any) => {
    try {
      const ins = await metaFetch(`/${a.id}/insights`, {
        fields: 'spend,impressions,clicks,reach,frequency,ctr,cpc,actions,action_values,cost_per_action_type',
        time_range: JSON.stringify({ since: from, until: to }),
      })
      return { ...a, insights: ins.data?.[0] ?? null }
    } catch {
      return { ...a, insights: null }
    }
  }))
  return withInsights
}

export function parseConversions(actions: any[]): number {
  if (!actions) return 0
  const types = ['purchase','lead','complete_registration','offsite_conversion.fb_pixel_purchase','offsite_conversion.fb_pixel_lead']
  return actions.filter(a => types.includes(a.action_type)).reduce((s, a) => s + Number(a.value), 0)
}

export function parseRevenue(actionValues: any[]): number {
  if (!actionValues) return 0
  return actionValues
    .filter(a => a.action_type==='purchase'||a.action_type==='offsite_conversion.fb_pixel_purchase')
    .reduce((s, a) => s + Number(a.value), 0)
}

export function parseLeads(actions: any[]): number {
  if (!actions) return 0
  return actions
    .filter(a => a.action_type==='lead'||a.action_type==='offsite_conversion.fb_pixel_lead')
    .reduce((s, a) => s + Number(a.value), 0)
}
