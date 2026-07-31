import jsPDF from 'jspdf'

interface PDFData {
  clientName: string
  company: string
  dateRange: string
  totals: any
  platforms: any[]
}

export async function generateReportPDF(data: PDFData) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 20
  let y = 0

  // Кольори
  const RED = [230, 0, 0] as [number,number,number]
  const DARK = [10, 10, 10] as [number,number,number]
  const GRAY = [120, 120, 120] as [number,number,number]
  const LIGHT = [240, 240, 240] as [number,number,number]
  const WHITE = [255, 255, 255] as [number,number,number]
  const GREEN = [0, 200, 100] as [number,number,number]

  // Фон шапки
  pdf.setFillColor(...RED)
  pdf.rect(0, 0, W, 45, 'F')

  // Логотип — знак нескінченності (два кола)
  pdf.setDrawColor(...WHITE)
  pdf.setLineWidth(1.5)
  pdf.circle(margin + 6, 16, 5, 'S')
  pdf.circle(margin + 16, 16, 5, 'S')

  // Назва агентства
  pdf.setTextColor(...WHITE)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Infinite Union', margin + 26, 18)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('AD TRACKER · ЗВІТ ПО РЕКЛАМІ', margin + 26, 24)

  // Дата в шапці
  pdf.setFontSize(9)
  pdf.text(data.dateRange, W - margin, 18, { align: 'right' })
  pdf.text(new Date().toLocaleDateString('uk'), W - margin, 24, { align: 'right' })

  y = 55

  // Інфо про клієнта
  pdf.setTextColor(...DARK)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(data.clientName, margin, y)
  y += 7

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...GRAY)
  pdf.text(data.company, margin, y)
  y += 12

  // Лінія
  pdf.setDrawColor(...LIGHT)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, W - margin, y)
  y += 10

  // Заголовок метрик
  pdf.setTextColor(...DARK)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ЗВЕДЕНІ МЕТРИКИ', margin, y)
  y += 8

  // Картки метрик — 2x2 сітка
  const t = data.totals
  const metrics = [
    { label: 'ВИТРАТИ', value: `$${(t.totalSpend ?? 0).toLocaleString('uk', {minimumFractionDigits:0,maximumFractionDigits:0})}`, color: RED },
    { label: 'ДОХІД', value: `$${(t.totalRevenue ?? 0).toLocaleString('uk', {minimumFractionDigits:0,maximumFractionDigits:0})}`, color: GREEN },
    { label: 'ПОКАЗИ', value: (t.totalImpressions ?? 0).toLocaleString('uk'), color: DARK },
    { label: 'КЛІКИ', value: (t.totalClicks ?? 0).toLocaleString('uk'), color: DARK },
    { label: 'КОНВЕРСІЇ', value: (t.totalConversions ?? 0).toLocaleString('uk'), color: GREEN },
    { label: 'CTR', value: `${(t.ctr ?? 0).toFixed(2)}%`, color: DARK },
    { label: 'CPC', value: `$${(t.cpc ?? 0).toFixed(2)}`, color: DARK },
    { label: 'ROAS', value: `${(t.roas ?? 0).toFixed(2)}x`, color: t.roas >= 2 ? GREEN : t.roas >= 1 ? [251,191,36] as [number,number,number] : RED },
  ]

  const cardW = (W - margin * 2 - 10) / 4
  const cardH = 22
  const cols = 4

  metrics.forEach((m, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = margin + col * (cardW + 3.3)
    const cy = y + row * (cardH + 4)

    // Фон картки
    pdf.setFillColor(...LIGHT)
    pdf.roundedRect(x, cy, cardW, cardH, 2, 2, 'F')

    // Значення
    pdf.setTextColor(...m.color)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text(m.value, x + cardW/2, cy + 10, { align: 'center' })

    // Лейбл
    pdf.setTextColor(...GRAY)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text(m.label, x + cardW/2, cy + 17, { align: 'center' })
  })

  y += Math.ceil(metrics.length / cols) * (cardH + 4) + 10

  // Розбивка по платформах
  if (data.platforms.length > 0) {
    pdf.setTextColor(...DARK)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('РОЗБИВКА ПО ПЛАТФОРМАХ', margin, y)
    y += 8

    // Заголовки таблиці
    const cols2 = ['Платформа', 'Витрати', 'Покази', 'Кліки', 'CTR', 'ROAS']
    const colW = [50, 28, 28, 25, 22, 22]
    let cx = margin

    pdf.setFillColor(...DARK)
    pdf.rect(margin, y, W - margin*2, 8, 'F')

    pdf.setTextColor(...WHITE)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    cols2.forEach((h, i) => {
      pdf.text(h, cx + 2, y + 5.5)
      cx += colW[i]
    })
    y += 8

    // Рядки платформ — дедублікуємо
    const seen = new Set<string>()
    const uniquePlatforms = data.platforms.filter(p => {
      if (seen.has(p.platform)) return false
      seen.add(p.platform)
      return true
    })

    uniquePlatforms.forEach((p, i) => {
      const s = p.summary
      const isEven = i % 2 === 0
      pdf.setFillColor(isEven ? 248 : 255, isEven ? 248 : 255, isEven ? 248 : 255)
      pdf.rect(margin, y, W - margin*2, 9, 'F')

      pdf.setTextColor(...DARK)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')

      const PLABEL: Record<string,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
      const row2 = [
        PLABEL[p.platform] ?? p.platform,
        `$${(s.totalSpend ?? 0).toFixed(0)}`,
        (s.totalImpressions ?? 0).toLocaleString('uk'),
        (s.totalClicks ?? 0).toLocaleString('uk'),
        `${(s.ctr ?? 0).toFixed(2)}%`,
        `${(s.roas ?? 0).toFixed(2)}x`,
      ]

      cx = margin
      row2.forEach((val, j) => {
        pdf.text(val, cx + 2, y + 6)
        cx += colW[j]
      })
      y += 9
    })
    y += 8
  }

  // Водяний знак
  pdf.setTextColor(230, 230, 230)
  pdf.setFontSize(60)
  pdf.setFont('helvetica', 'bold')
  pdf.text('INFINITE UNION', W/2, 200, { align:'center', angle:45 })

  // Футер
  pdf.setFillColor(...DARK)
  pdf.rect(0, 287, W, 10, 'F')
  pdf.setTextColor(...WHITE)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Infinite Union · Ad Tracker · Конфіденційний звіт', margin, 293)
  pdf.text(`Згенеровано: ${new Date().toLocaleString('uk')}`, W - margin, 293, { align: 'right' })

  return pdf
}
