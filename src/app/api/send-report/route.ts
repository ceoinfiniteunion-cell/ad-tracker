import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { to, clientName, company, dateRange, totals, platforms } = await request.json()

  if (!to) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  })

  const PLABEL: Record<string,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
  const fmt = (n: number) => (n ?? 0).toLocaleString('uk', {minimumFractionDigits:0,maximumFractionDigits:0})
  const fmtUSD = (n: number) => `$${fmt(n)}`
  const fmtPct = (n: number) => `${(n ?? 0).toFixed(2)}%`

  const seen = new Set<string>()
  const uniquePlatforms = (platforms ?? []).filter((p: any) => {
    if (seen.has(p.platform)) return false
    seen.add(p.platform)
    return true
  })

  const t = totals ?? {}

  const platformRows = uniquePlatforms.map((p: any) => {
    const s = p.summary
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-weight:600">${PLABEL[p.platform] ?? p.platform}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;color:#e60000;font-weight:700;font-family:monospace">${fmtUSD(s.totalSpend)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;color:#00a855;font-family:monospace">${fmtUSD(s.totalRevenue)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-family:monospace">${fmt(s.totalClicks)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-family:monospace">${fmtPct(s.ctr)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;font-family:monospace;font-weight:700;color:${s.roas>=2?'#00a855':s.roas>=1?'#d97706':'#e60000'}">${(s.roas??0).toFixed(2)}×</td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Шапка -->
    <div style="background:#e60000;padding:28px 32px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="display:inline-flex;gap:-4px">
            <span style="display:inline-block;width:20px;height:20px;border:3px solid #fff;border-radius:50%;margin-right:-6px"></span>
            <span style="display:inline-block;width:20px;height:20px;border:3px solid #fff;border-radius:50%"></span>
          </div>
          <span style="color:#fff;font-size:20px;font-weight:800;margin-left:8px">Infinite Union</span>
        </div>
        <div style="color:rgba(255,255,255,0.8);font-size:10px;letter-spacing:0.15em">AD TRACKER · ЗВІТ ПО РЕКЛАМІ</div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,0.85);font-size:11px">
        <div>${dateRange}</div>
        <div style="margin-top:4px">${new Date().toLocaleDateString('uk')}</div>
      </div>
    </div>

    <!-- Клієнт -->
    <div style="padding:24px 32px;border-bottom:1px solid #eee">
      <div style="font-size:22px;font-weight:800;color:#111;margin-bottom:4px">${clientName}</div>
      <div style="font-size:13px;color:#666">${company}</div>
      <div style="font-size:12px;color:#e60000;font-weight:600;margin-top:6px">Період: ${dateRange}</div>
    </div>

    <!-- Метрики -->
    <div style="padding:24px 32px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:14px">Зведені метрики</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        ${[
          { label:'Витрати', value:fmtUSD(t.totalSpend), color:'#e60000' },
          { label:'Дохід', value:fmtUSD(t.totalRevenue), color:'#00a855' },
          { label:'Покази', value:fmt(t.totalImpressions), color:'#111' },
          { label:'Кліки', value:fmt(t.totalClicks), color:'#111' },
          { label:'Конверсії', value:fmt(t.totalConversions), color:'#00a855' },
          { label:'CTR', value:fmtPct(t.ctr), color:'#111' },
          { label:'CPC', value:fmtUSD(t.cpc), color:'#111' },
          { label:'ROAS', value:`${(t.roas??0).toFixed(2)}×`, color: t.roas>=2?'#00a855':t.roas>=1?'#d97706':'#e60000' },
        ].map(m => `
          <div style="background:#f5f5f5;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:16px;font-weight:800;font-family:monospace;color:${m.color}">${m.value}</div>
            <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#999;margin-top:4px">${m.label}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Таблиця платформ -->
    ${uniquePlatforms.length > 0 ? `
    <div style="padding:0 32px 24px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:14px">Розбивка по платформах</div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#111">
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">Платформа</th>
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">Витрати</th>
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">Дохід</th>
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">Кліки</th>
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">CTR</th>
            <th style="padding:8px 14px;text-align:left;color:#fff;font-size:9px;letter-spacing:0.08em;text-transform:uppercase">ROAS</th>
          </tr>
        </thead>
        <tbody>${platformRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Футер -->
    <div style="background:#111;padding:14px 32px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:rgba(255,255,255,0.6);font-size:10px">Infinite Union · Ad Tracker · Конфіденційний звіт</span>
      <span style="color:rgba(255,255,255,0.4);font-size:10px">Згенеровано: ${new Date().toLocaleString('uk')}</span>
    </div>
  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"Infinite Union Ad Tracker" <${process.env.GMAIL_USER}>`,
      to,
      subject: `📊 Звіт по рекламі — ${clientName} · ${dateRange}`,
      html,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Email error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
