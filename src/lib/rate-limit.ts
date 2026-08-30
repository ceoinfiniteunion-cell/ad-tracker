const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ip: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxAttempts - 1 }
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: maxAttempts - record.count }
}
