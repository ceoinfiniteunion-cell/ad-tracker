import { Redis } from '@upstash/redis'

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

export async function blacklistToken(jti: string, expiresAt: number): Promise<void> {
  const r = getRedis()
  if (!r) return
  const ttl = Math.max(1, Math.floor((expiresAt * 1000 - Date.now()) / 1000))
  await r.set(`blacklist:${jti}`, '1', { ex: ttl }).catch(console.error)
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const r = getRedis()
  if (!r) return false
  try {
    const val = await r.get(`blacklist:${jti}`)
    return val === '1'
  } catch {
    return false
  }
}
