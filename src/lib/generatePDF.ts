export async function generateReportPDF(data: {
  clientName: string
  company: string
  dateRange: string
  totals: any
  platforms: any[]
}) {
  const t = data.totals
  const fmt = (n: number) => n?.toLocaleString('uk', {minimumFractionDigits:0,maximumFractionDigits:0}) ?? '0'
  const fmtUSD = (n: number) => `$${fmt(n)}`
  const fmtPct = (n: number) => `${(n??0).toFixed(2)}%`
  const PLABEL: Record<string,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }

  const seen = new Set<string>()
  const uniquePlatforms = data.platforms.filter(p => {
    if (seen.has(p.platform)) return false
    seen.add(p.platform)
    return true
  })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background:#fff; color:#111; }
  
  .header { background:#e60000; color:#fff; padding:24px 32px; display:flex; justify-content:space-between; align-items:center; }
  .logo { display:flex; align-items:center; gap:14px; }
  .logo-icon { display:flex; gap:-4px; }
  .logo-circle { width:22px; height:22px; border:3px solid #fff; border-radius:50%; display:inline-block; margin-right:-6px; }
  .logo-text h1 { font-size:20px; font-weight:800; }
  .logo-text p { font-size:10px; opacity:0.8; letter-spacing:0.15em; margin-top:2px; }
  .header-date { text-align:right; font-size:11px; opacity:0.85; line-height:1.6; }

  .client-section { padding:28px 32px 20px; border-bottom:1px solid #eee; }
  .client-name { font-size:24px; font-weight:800; margin-bottom:4px; }
  .client-company { font-size:13px; color:#666; }
  .date-range { font-size:12px; color:#e60000; font-weight:600; margin-top:6px; }

  .section { padding:24px 32px; }
  .section-title { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#999; margin-bottom:14px; }

  .metrics-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .metric-card { background:#f5f5f5; border-radius:8px; padding:14px 16px; }
  .metric-value { font-size:18px; font-weight:800; font-family:monospace; margin-bottom:4px; }
  .metric-label { font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#999; }

  .table { width:100%; border-collapse:collapse; margin-top:8px; }
  .table th { background:#111; color:#fff; padding:8px 12px; text-align:left; font-size:9px; letter-spacing:0.08em; text-transform:uppercase; }
  .table td { padding:10px 12px; font-size:12px; border-bottom:1px solid #f0f0f0; }
  .table tr:nth-child(even) td { background:#fafafa; }

  .footer { background:#111; color:#fff; padding:10px 32px; display:flex; justify-content:space-between; font-size:9px; opacity:0.9; position:fixed; bottom:0; left:0; right:0; }

  .red { color:#e60000; }
  .green { color:#00a855; }
  .yellow { color:#d97706; }

  .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-45deg); font-size:80px; font-weight:900; color:rgba(230,0,0,0.04); white-space:nowrap; pointer-events:none; z-index:0; letter-spacing:0.1em; }

  @media print {
    .footer { position:fixed; bottom:0; }
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>

<div class="watermark">INFINITE UNION</div>

<div class="header">
  <div class="logo">
    <div class="logo-icon">
      <span class="logo-circle"></span>
      <span class="logo-circle"></span>
    </div>
    <div class="logo-text">
      <h1>Infinite Union</h1>
      <p>AD TRACKER · ЗВІТ ПО РЕКЛАМІ</p>
    </div>
  </div>
  <div class="header-date">
    <div>${data.dateRange}</div>
    <div>${new Date().toLocaleDateString('uk')}</div>
  </div>
</div>

<div class="client-section">
  <div class="client-name">${data.clientName}</div>
  <div class="client-company">${data.company}</div>
  <div class="date-range">Період: ${data.dateRange}</div>
</div>

<div class="section">
  <div class="section-title">Зведені метрики</div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value red">${fmtUSD(t.totalSpend)}</div>
      <div class="metric-label">Витрати</div>
    </div>
    <div class="metric-card">
      <div class="metric-value green">${fmtUSD(t.totalRevenue)}</div>
      <div class="metric-label">Дохід</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${fmt(t.totalImpressions)}</div>
      <div class="metric-label">Покази</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${fmt(t.totalClicks)}</div>
      <div class="metric-label">Кліки</div>
    </div>
    <div class="metric-card">
      <div class="metric-value green">${fmt(t.totalConversions)}</div>
      <div class="metric-label">Конверсії</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${fmtPct(t.ctr)}</div>
      <div class="metric-label">CTR</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${fmtUSD(t.cpc)}</div>
      <div class="metric-label">CPC</div>
    </div>
    <div class="metric-card">
      <div class="metric-value ${t.roas>=2?'green':t.roas>=1?'yellow':'red'}">${(t.roas??0).toFixed(2)}×</div>
      <div class="metric-label">ROAS</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Розбивка по платформах</div>
  <table class="table">
    <thead>
      <tr>
        <th>Платформа</th>
        <th>Витрати</th>
        <th>Дохід</th>
        <th>Покази</th>
        <th>Кліки</th>
        <th>CTR</th>
        <th>ROAS</th>
      </tr>
    </thead>
    <tbody>
      ${uniquePlatforms.map(p => {
        const s = p.summary
        const roas = s.roas ?? 0
        const roasClass = roas>=2?'green':roas>=1?'yellow':'red'
        return `<tr>
          <td><strong>${PLABEL[p.platform] ?? p.platform}</strong></td>
          <td class="red"><strong>${fmtUSD(s.totalSpend)}</strong></td>
          <td class="green">${fmtUSD(s.totalRevenue)}</td>
          <td>${fmt(s.totalImpressions)}</td>
          <td>${fmt(s.totalClicks)}</td>
          <td>${fmtPct(s.ctr)}</td>
          <td class="${roasClass}"><strong>${roas.toFixed(2)}×</strong></td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
</div>

<div class="footer">
  <span>Infinite Union · Ad Tracker · Конфіденційний звіт</span>
  <span>Згенеровано: ${new Date().toLocaleString('uk')}</span>
</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
