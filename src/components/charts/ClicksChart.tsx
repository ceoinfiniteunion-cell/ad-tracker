'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export function ClicksChart({ data, title='Кліки та конверсії' }: { data: DailyMetric[]; title?: string }) {
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px' }}>
      <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', margin:'0 0 4px' }}>{title}</p>
      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'0 0 20px' }}>За останні 30 днів</p>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={formatted} margin={{ top:4, right:4, left:0, bottom:0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize:10, fill:'rgba(255,255,255,0.28)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:10, fill:'rgba(255,255,255,0.28)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#fff', fontSize:'12px' }} formatter={(v:number,n:string)=>[v.toLocaleString(),n==='clicks'?'Кліки':'Конверсії']} />
          <Bar dataKey="clicks" fill="#e60000" fillOpacity={0.8} radius={[3,3,0,0]} />
          <Bar dataKey="conversions" fill="rgba(255,255,255,0.12)" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
