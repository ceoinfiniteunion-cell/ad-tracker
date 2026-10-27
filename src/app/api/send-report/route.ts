import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { isValidEmail } from '@/lib/api-security'
import { Resend } from 'resend'

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const fmt = (n: number, digits = 0) => n.toLocaleString('uk-UA', { minimumFractionDigits: digits, maximumFractionDigits: digits })

// Лист збирається на сервері з чисел; ім'я клієнта береться з БД, а не з тіла запиту
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { ok } = await rateLimit(`send-report:${user.id}`, 10, 60 * 60 * 1000)
  if (!ok) return NextResponse.json({ error: 'Забагато відправок. Спробуйте пізніше.' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const { to, clientId, dateRange, totals, platforms, currency, rate } = body

  if (typeof to !== 'string' || !isValidEmail(to.trim())) {
    return NextResponse.json({ error: 'Невірний email' }, { status: 400 })
  }

  const resolvedClientId = user.role === 'ADMIN' ? clientId : user.clientId
  if (!resolvedClientId) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const client = await prisma.client.findUnique({ where: { id: resolvedClientId }, select: { name: true, company: true } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const cur = typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : 'USD'
  // Курс показу, як на сторінці звітів (сума × rate у валюті профілю)
  const r = num(rate) > 0 && num(rate) < 1e6 ? num(rate) : 1
  const t = totals ?? {}
  const rows: Array<[string, string]> = [
    ['Витрати', `${fmt(num(t.totalSpend) * r, 2)} ${cur}`],
    ['Покази', fmt(num(t.totalImpressions))],
    ['Кліки', fmt(num(t.totalClicks))],
    ['CTR', `${fmt(num(t.ctr), 2)}%`],
    ['Конверсії', fmt(num(t.totalConversions))],
    ['Дохід', `${fmt(num(t.totalRevenue) * r, 2)} ${cur}`],
    ['ROAS', fmt(num(t.roas), 2)],
  ]
  const platformRows = (Array.isArray(platforms) ? platforms.slice(0, 50) : []).map((p: any) =>
    `<tr><td style="padding:8px 0;color:#555">${esc(p?.platform)} · ${esc(p?.accountName)}</td><td style="padding:8px 0;text-align:right;font-weight:700">${fmt(num(p?.summary?.totalSpend) * r, 2)} ${cur}</td></tr>`
  ).join('')

  const period = typeof dateRange === 'string' ? dateRange.slice(0, 40) : ''
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#e60000;padding:28px 32px">
      <span style="color:#fff;font-size:18px;font-weight:800">Infinite Union</span>
      <div style="color:rgba(255,255,255,0.8);font-size:10px;letter-spacing:0.15em;margin-top:4px">AD TRACKER · ЗВІТ</div>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px;color:#111;margin:0 0 4px;font-weight:700">${esc(client.company || client.name)}</p>
      <p style="font-size:12px;color:#999;margin:0 0 24px">${esc(period)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#555">${k}</td><td style="padding:8px 0;text-align:right;font-weight:700">${v}</td></tr>`).join('')}
      </table>
      ${platformRows ? `<p style="font-size:12px;color:#999;margin:24px 0 8px;text-transform:uppercase">Платформи</p><table style="width:100%;border-collapse:collapse;font-size:13px">${platformRows}</table>` : ''}
    </div>
    <div style="background:#111;padding:14px 32px">
      <span style="color:rgba(255,255,255,0.5);font-size:10px">Infinite Union · Ad Tracker</span>
    </div>
  </div>
</body></html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'Infinite Union Ad Tracker <noreply@infiniteunion.com.ua>',
    to: to.trim(),
    subject: `Звіт по рекламі — ${(client.company || client.name).slice(0, 100)}`,
    html,
  })

  if (error) {
    console.error('[SEND REPORT ERROR]', error)
    return NextResponse.json({ error: 'Не вдалося відправити звіт' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
