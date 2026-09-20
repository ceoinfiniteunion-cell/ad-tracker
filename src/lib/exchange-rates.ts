import { Redis } from '@upstash/redis'

const CACHE_KEY = 'exchange_rates:usd_base'
const TTL_SECONDS = 3600

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, UAH: 41.5, EUR: 0.93, GBP: 0.79, PLN: 4.0,
}

export async function getUsdRates(): Promise<Record<string, number>> {
  const r = getRedis()

  if (r) {
    try {
      const cached = await r.get<Record<string, number>>(CACHE_KEY)
      if (cached && typeof cached === 'object') return cached
    } catch {}
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      cache: 'no-store',
    })
    const data = await res.json()
    const rates: Record<string, number> = data.rates ?? {}
    rates.USD = 1

    if (r) {
      try { await r.setex(CACHE_KEY, TTL_SECONDS, rates) } catch {}
    }

    return rates
  } catch {
    return FALLBACK_RATES
  }
}

export function conversionRate(
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (from === to) return 1
  const rateFrom = rates[from] ?? 1
  const rateTo = rates[to] ?? 1
  return rateTo / rateFrom
}
