'use client'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

interface Props {
  data: any[]
  title?: string
  subtitle?: string
  platformData?: { platform: string; color: string; label: string; daily: any[] }[]
}

export function ClicksChart({ data, title='Кліки та конверсії', subtitle, platformData }: Props) {
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
            <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text3)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:'var(--text3)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'12px' }}
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
              <Bar key={p.platform} dataKey={p.platform} fill={p.color} fillOpacity={0.8} radius={[3,3,0,0]} />
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
          <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text3)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:10, fill:'var(--text3)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'12px' }}
            formatter={(v: number, n: string) => [v.toLocaleString(), n==='clicks'?'Кліки':'Конверсії']}
          />
          <Legend formatter={v => <span style={{ color:'var(--text3)', fontSize:'11px' }}>{v==='clicks'?'Кліки':'Конверсії'}</span>} />
          <Bar dataKey="clicks" fill="#e60000" fillOpacity={0.8} radius={[3,3,0,0]} />
          <Bar dataKey="conversions" fill="#00c864" fillOpacity={0.6} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
