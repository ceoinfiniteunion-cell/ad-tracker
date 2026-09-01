import { NextResponse } from 'next/server'

// Цей endpoint більше не використовується.
// 2FA вмикається/вимикається через /api/auth/2fa/send + /api/auth/2fa/verify
export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/2fa/send and /api/auth/2fa/verify' }, { status: 410 })
}
