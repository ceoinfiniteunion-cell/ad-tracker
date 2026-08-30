import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const rec = rateLimitStore.get(key)
  if (!rec || now > rec.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (rec.count >= max) return false
  rec.count++
  return true
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const ip = getClientIp(req)

    // Rate limit на API
    if (pathname.startsWith('/api/')) {
      const isAuthRoute = pathname.includes('/api/auth/')
      const max = isAuthRoute ? 10 : 60
      const window = isAuthRoute ? 5 * 60 * 1000 : 60 * 1000
      if (!checkRateLimit(`api:${ip}:${isAuthRoute ? 'auth' : 'general'}`, max, window)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
    }

    // Захист адмін-маршрутів
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Редірект адміна з клієнтського дашборду
    if (pathname.startsWith('/dashboard') && token?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/clients', req.url))
    }

    // Security headers на всі відповіді
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        // Публічні API routes
        if (pathname === '/api/auth/register') return true
        if (pathname.startsWith('/api/cron/')) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/((?!auth/register|cron/).*)',
  ],
}
