'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { useTheme } from '@/lib/theme'

interface Props {
  data: any[]
  title?: string
  subtitle?: string
  platformData?: { platform: string; color: string; label: string; daily: any[] }[]
}

export function ClicksChart({ data, title='Кліки та конверсії', subtitle, platformData }: Props) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.4)'
  const tooltipBg = theme === 'dark' ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const tooltipColor = theme === 'dark' ? '#fff' : '#000'
  // Порівняння платформ
  if (platformData && platformData.length > 1) {
    const dateSet = new Set<string>()
    platformData.forEach(p => p.daily.forEach((d: any) => dateSet.add(d.date)))
    const dates = Array.from(dateSet).sort()

    const merged = dates.map(date => {
      const row: any = { date: format(new Date(date), 'd MMM', { locale: uk }) }
      platformData.forEach(p => {
        const day = p.daily.find((d: any) => d.date === date)
        row[p.platform] = day?.clicks ?? 0
      })
      return row
    })

    return (
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' }}>
        <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>{title}</p>
        <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:'0 0 20px' }}>{subtitle ?? 'Порівняння платформ'}</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={merged} margin={{ top:4, right:4, left:0, bottom:0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background:tooltipBg, border:`1px solid ${tooltipBorder}`, borderRadius:'8px', color:tooltipColor, fontSize:'12px' }}
              formatter={(v: number, name: string) => {
                const p = platformData.find(x => x.platform === name)
                return [v.toLocaleString(), p?.label ?? name]
              }}
            />
            <Legend formatter={v => {
              const p = platformData.find(x => x.platform === v)
              return <span style={{ color:'var(--text3)', fontSize:'11px' }}>{p?.label ?? v}</span>
            }}/>
            {platformData.map(p => (
              <Bar key={p.platform} dataKey={p.platform} fill={p.color} fillOpacity={0.85} radius={[4,4,0,0]} maxBarSize={32} activeBar={{ fillOpacity:1, filter:`drop-shadow(0 0 8px ${p.color}99)` }} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Звичайний режим
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' }}>
      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>{title}</p>
      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:'0 0 20px' }}>{subtitle ?? 'За останні 30 днів'}</p>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={formatted} margin={{ top:4, right:4, left:0, bottom:0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background:tooltipBg, border:`1px solid ${tooltipBorder}`, borderRadius:'8px', color:tooltipColor, fontSize:'12px' }}
            formatter={(v: number, n: string) => [
              <span style={{ fontWeight:700, fontFamily:'monospace' }}>{v.toLocaleString()}</span>,
              n==='clicks'?'Кліки':'Конверсії'
            ]}
            labelStyle={{ fontWeight:700, marginBottom:'6px', color:tooltipColor }}
            cursor={{ fill: theme==='dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', radius:6, strokeWidth:0 }}
          />
          <Legend formatter={v => <span style={{ color:'var(--text3)', fontSize:'11px' }}>{v==='clicks'?'Кліки':'Конверсії'}</span>} />
          <Bar dataKey="clicks" fill="#e60000" fillOpacity={0.85} radius={[4,4,0,0]} maxBarSize={32} activeBar={{ fill:'#ff4444', fillOpacity:1, filter:'drop-shadow(0 0 8px rgba(230,0,0,0.7))' }} />
          <Bar dataKey="conversions" fill="#00c864" fillOpacity={0.75} radius={[4,4,0,0]} maxBarSize={32} activeBar={{ fill:'#00e874', fillOpacity:1, filter:'drop-shadow(0 0 8px rgba(0,200,100,0.7))' }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
