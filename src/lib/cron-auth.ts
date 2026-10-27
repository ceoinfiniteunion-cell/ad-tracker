import { timingSafeEqual } from 'crypto'

// true лише якщо CRON_SECRET задано і заголовок Authorization: Bearer <secret> збігається
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}
