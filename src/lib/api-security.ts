import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { rateLimit, getIp } from './rate-limit'

export { rateLimit, getIp, LIMITS } from './rate-limit'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  if ((session.user as any).role !== 'ADMIN') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  return { error: null, session }
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  return { error: null, session }
}

export function sanitizeString(str: unknown, maxLen = 500): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLen).replace(/<[^>]*>/g, '')
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function isValidPassword(password: unknown): boolean {
  if (typeof password !== 'string') return false
  return password.length >= 6 && password.length <= 128
}

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
