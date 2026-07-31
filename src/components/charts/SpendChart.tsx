'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { useTheme } from '@/lib/theme'

interface Props {
  data: any[]
  title?: string
  subtitle?: string
  platformData?: { platform: string; color: string; label: string; daily: any[] }[]
}

export function SpendChart({ data, title='Витрати та дохід', subtitle, platformData }: Props) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.4)'
  const tooltipBg = theme === 'dark' ? '#1a1a1a' : '#ffffff'
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const tooltipColor = theme === 'dark' ? '#fff' : '#000'
  // Якщо є platformData — показуємо порівняння платформ
  if (platformData && platformData.length > 1) {
    // Мержимо всі дати
    const dateSet = new Set<string>()
    platformData.forEach(p => p.daily.forEach((d: any) => dateSet.add(d.date)))
    const dates = Array.from(dateSet).sort()

    const merged = dates.map(date => {
      const row: any = { date: format(new Date(date), 'd MMM', { locale: uk }) }
      platformData.forEach(p => {
        const day = p.daily.find((d: any) => d.date === date)
        row[p.platform] = day?.spend ?? 0
      })
      return row
    })

    return (
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' }}>
        <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>{title}</p>
        <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:'0 0 20px' }}>{subtitle ?? 'Порівняння платформ'}</p>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={merged} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              {platformData.map(p => (
                <linearGradient key={p.platform} id={`g_${p.platform}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={p.color} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={p.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
            <Tooltip
              contentStyle={{ background:tooltipBg, border:`1px solid ${tooltipBorder}`, borderRadius:'8px', color:tooltipColor, fontSize:'12px' }}
              formatter={(v: number, name: string) => {
                const p = platformData.find(x => x.platform === name)
                return [`$${v.toFixed(0)}`, p?.label ?? name]
              }}
            />
            <Legend formatter={v => {
              const p = platformData.find(x => x.platform === v)
              return <span style={{ color:'var(--text3)', fontSize:'11px' }}>{p?.label ?? v}</span>
            }}/>
            {platformData.map(p => (
              <Area key={p.platform} type="monotone" dataKey={p.platform} stroke={p.color} strokeWidth={2} fill={`url(#g_${p.platform})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Звичайний режим — витрати + дохід
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'24px' }}>
      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>{title}</p>
      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:'0 0 20px' }}>{subtitle ?? 'За останні 30 днів'}</p>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={formatted} margin={{ top:4, right:4, left:0, bottom:0 }}>
          <defs>
            <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e60000" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#e60000" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00c864" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#00c864" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:10, fill:textColor, fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
          <Tooltip
            contentStyle={{ background:tooltipBg, border:`1px solid ${tooltipBorder}`, borderRadius:'8px', color:tooltipColor, fontSize:'12px' }}
            formatter={(v: number, n: string) => [`$${v.toFixed(0)}`, n==='spend'?'Витрати':'Дохід']}
          />
          <Legend formatter={v => <span style={{ color:'var(--text3)', fontSize:'11px' }}>{v==='spend'?'Витрати':'Дохід'}</span>} />
          <Area type="monotone" dataKey="spend" stroke="#e60000" strokeWidth={2} fill="url(#gS)" />
          <Area type="monotone" dataKey="revenue" stroke="#00c864" strokeWidth={2} fill="url(#gR)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
