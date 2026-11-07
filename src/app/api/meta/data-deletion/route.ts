import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { parseMetaSignedRequest } from '@/lib/meta-signed-request'

// Meta Data Deletion Request Callback.
// Meta надсилає POST із signed_request, коли користувач видаляє застосунок і просить видалити дані.
// Відповідь: { url, confirmation_code } — url веде на сторінку статусу запиту.

const ACTION = 'META_DATA_DELETION_REQUEST'

export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const contentType = request.headers.get('content-type') ?? ''
  let signedRequest: string | null = null
  if (contentType.includes('application/json')) {
    signedRequest = (await request.json().catch(() => ({}))).signed_request ?? null
  } else {
    signedRequest = (await request.formData().catch(() => null))?.get('signed_request')?.toString() ?? null
  }
  if (!signedRequest) return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 })

  const data = parseMetaSignedRequest(signedRequest, appSecret)
  if (!data) return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 })

  const code = randomBytes(8).toString('hex')
  await audit(ACTION, `meta:${data.user_id}`, { code, platformUserId: data.user_id, status: 'received' })

  // Дані привʼязані до кабінетів клієнта, а не до Facebook-профілю — запит обробляє адміністратор
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Infinite Union Ad Tracker <noreply@infiniteunion.com.ua>',
      to: 'ceo@infiniteunion.com.ua',
      subject: `Meta data deletion request ${code}`,
      html: `<p>Meta data deletion request received.</p><p>Confirmation code: <b>${code}</b><br>Meta app-scoped user ID: ${data.user_id}</p><p>Delete the connected Meta ad accounts, tokens and metrics of this user within 30 days.</p>`,
    })
  } catch (e) {
    console.error('[META DATA DELETION] Notify failed:', e)
  }

  const baseUrl = process.env.NEXTAUTH_URL!
  return NextResponse.json({ url: `${baseUrl}/data-deletion?code=${code}`, confirmation_code: code })
}

// Статус запиту за кодом підтвердження (для сторінки /data-deletion)
export async function GET(request: NextRequest) {
  const { ok } = await rateLimit(`data-deletion:${getIp(request)}`, 20, 60 * 1000)
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!/^[0-9a-f]{16}$/.test(code)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  const entry = await prisma.auditLog.findFirst({
    where: { action: ACTION, meta: { path: ['code'], equals: code } },
    select: { meta: true, createdAt: true },
  })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const meta = entry.meta as { status?: string; completedAt?: string }
  return NextResponse.json({ code, status: meta.status ?? 'received', receivedAt: entry.createdAt, completedAt: meta.completedAt ?? null })
}
