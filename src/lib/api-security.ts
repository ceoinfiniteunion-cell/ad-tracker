import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// ============ RATE LIMITER ============
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean } {
  const now = Date.now()
  const rec = store.get(key)
  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (rec.count >= max) return { ok: false }
  rec.count++
  return { ok: true }
}

export function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ============ AUTH HELPERS ============
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

// ============ INPUT VALIDATION ============
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

// ============ SECURITY RESPONSE HEADERS ============
export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

// ============ RATE LIMIT PRESETS ============
export const LIMITS = {
  LOGIN:    { max: 5,  windowMs: 15 * 60 * 1000 }, // 5 per 15min
  REGISTER: { max: 3,  windowMs: 60 * 60 * 1000 }, // 3 per hour
  API:      { max: 60, windowMs: 60 * 1000 },       // 60 per min
  SYNC:     { max: 10, windowMs: 60 * 1000 },       // 10 per min
}
