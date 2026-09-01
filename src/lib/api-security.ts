import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Rate limiter для API (in-memory)
const apiStore = new Map<string, { count: number; resetAt: number }>()

export function checkApiRateLimit(key: string, max = 60, windowMs = 60000): boolean {
  const now = Date.now()
  const rec = apiStore.get(key)
  if (!rec || now > rec.resetAt) {
    apiStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (rec.count >= max) return false
  rec.count++
  return true
}

// Перевірка що юзер авторизований і є адміном
export async function requireAdmin(req?: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null // OK
}

// Перевірка що юзер авторизований
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

// Валідація пароля
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Пароль має містити мінімум 8 символів'
  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) return 'Пароль має містити літери'
  if (!/[0-9]/.test(password)) return 'Пароль має містити хоча б одну цифру'
  return null
}

// Санітизація вхідних даних
export function sanitize(str: string): string {
  return str.trim().slice(0, 1000)
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}
