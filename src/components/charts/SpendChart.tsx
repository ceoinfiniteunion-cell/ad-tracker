'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export function SpendChart({ data, title='Витрати та дохід' }: { data: DailyMetric[]; title?: string }) {
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px' }}>
      <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', margin:'0 0 4px' }}>{title}</p>
      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'0 0 20px' }}>За останні 30 днів</p>
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize:10, fill:'rgba(255,255,255,0.28)', fontFamily:'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize:10, fill:'rgba(255,255,255,0.28)', fontFamily:'monospace' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
          <Tooltip contentStyle={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#fff', fontSize:'12px' }} formatter={(v:number,n:string)=>[`$${v.toFixed(0)}`,n==='spend'?'Витрати':'Дохід']} />
          <Legend formatter={v=><span style={{color:'rgba(255,255,255,0.45)',fontSize:'11px'}}>{v==='spend'?'Витрати':'Дохід'}</span>} />
          <Area type="monotone" dataKey="spend" stroke="#e60000" strokeWidth={2} fill="url(#gS)" />
          <Area type="monotone" dataKey="revenue" stroke="#00c864" strokeWidth={2} fill="url(#gR)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
