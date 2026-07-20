'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export function ClicksChart({ data, title = 'Кліки та конверсії' }: { data: DailyMetric[]; title?: string }) {
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div className="iu-card p-6">
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="mono text-xs mb-6" style={{color:'rgba(255,255,255,0.3)'}}>За останні 30 днів</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background:'#161616', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#fff', fontSize:'13px' }} formatter={(v: number, n: string) => [v.toLocaleString(), n === 'clicks' ? 'Кліки' : 'Конверсії']} />
          <Bar dataKey="clicks" fill="rgba(230,0,0,0.7)" radius={[3,3,0,0]} />
          <Bar dataKey="conversions" fill="rgba(255,255,255,0.15)" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
