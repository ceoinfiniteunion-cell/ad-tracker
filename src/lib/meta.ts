export const META_API_VERSION = 'v27.0'
export const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`
const BASE_URL = META_GRAPH_URL

async function metaFetch(path: string, params: Record<string, string> = {}, token?: string) {
  const accessToken = token ?? process.env.META_ACCESS_TOKEN
  if (!accessToken) throw new Error('META_ACCESS_TOKEN not set')
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('access_token', accessToken)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
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

export async function getAccountInsights(accountId: string, from: string, to: string, token?: string) {
  const data = await metaFetch(`/${accountId}/insights`, {
    fields: 'spend,impressions,clicks,reach,frequency,ctr,cpc,cpp,cpm,actions,action_values,cost_per_action_type,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions',
    time_range: JSON.stringify({ since: from, until: to }),
    time_increment: '1',
    level: 'account',
  }, token)
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

// Статуси кабінетів Meta, які не можна підключити: 2 — disabled, 100 — pending closure, 101 — closed
const META_SKIP_STATUSES = new Set([2, 100, 101])

export interface MetaDiscoveredAccount { externalId: string; name: string; currency?: string }

async function listAdAccounts(path: string, token: string): Promise<MetaDiscoveredAccount[]> {
  const accounts: MetaDiscoveredAccount[] = []
  let after: string | undefined
  for (let page = 0; page < 20; page++) {
    const data = await metaFetch(path, {
      fields: 'id,name,account_status,currency',
      limit: '100',
      ...(after ? { after } : {}),
    }, token)
    for (const a of data.data ?? []) {
      if (META_SKIP_STATUSES.has(Number(a.account_status))) continue
      accounts.push({ externalId: a.id, name: a.name || `Meta Ads ${a.id}`, currency: a.currency })
    }
    after = data.paging?.next ? data.paging?.cursors?.after : undefined
    if (!after) break
  }
  return accounts
}

export async function discoverMetaAccounts(token: string): Promise<MetaDiscoveredAccount[]> {
  const direct = await listAdAccounts('/me/adaccounts', token)
  if (direct.length > 0) return direct

  // Токен system user з Login for Business: кабінети бізнесу клієнта, видані під час авторизації
  let businessId: string | undefined
  try {
    businessId = (await metaFetch('/me', { fields: 'client_business_id' }, token)).client_business_id
  } catch {
    return direct
  }
  if (!businessId) return direct

  const found = new Map<string, MetaDiscoveredAccount>()
  for (const edge of ['owned_ad_accounts', 'client_ad_accounts']) {
    try {
      for (const a of await listAdAccounts(`/${businessId}/${edge}`, token)) found.set(a.externalId, a)
    } catch (e) {
      console.error(`[META] ${edge} failed:`, (e as Error).message)
    }
  }
  return Array.from(found.values())
}
