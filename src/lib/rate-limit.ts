import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let limiters: Record<string, Ratelimit> = {}

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

function getLimiter(key: string, max: number, windowSeconds: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  const id = `${key}:${max}:${windowSeconds}`
  if (!limiters[id]) {
    limiters[id] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds}s`),
      prefix: `rl:${key}`,
    })
  }
  return limiters[id]
}

// In-memory fallback якщо Redis недоступний
const memStore = new Map<string, { count: number; resetAt: number }>()
function memLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const rec = memStore.get(key)
  if (!rec || now > rec.resetAt) { memStore.set(key, { count: 1, resetAt: now + windowMs }); return true }
  if (rec.count >= max) return false
  rec.count++
  return true
}

export async function rateLimit(identifier: string, max: number, windowMs: number): Promise<{ ok: boolean }> {
  const windowSeconds = Math.floor(windowMs / 1000)
  const limiter = getLimiter('default', max, windowSeconds)

  if (!limiter) {
    return { ok: memLimit(identifier, max, windowMs) }
  }

  try {
    const { success } = await limiter.limit(identifier)
    return { ok: success }
  } catch (e) {
    console.error('[RATE LIMIT] Redis error, falling back to memory:', e)
    return { ok: memLimit(identifier, max, windowMs) }
  }
}

export function getIp(req: Request | { headers: { get: (key: string) => string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() ?? 'unknown'
}

export const LIMITS = {
  LOGIN:    { max: 5,  windowMs: 15 * 60 * 1000 },
  REGISTER: { max: 3,  windowMs: 60 * 60 * 1000 },
  API:      { max: 60, windowMs: 60 * 1000 },
  SYNC:     { max: 10, windowMs: 60 * 1000 },
}
