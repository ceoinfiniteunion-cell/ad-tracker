'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export function SpendChart({ data, title = 'Витрати та дохід' }: { data: DailyMetric[]; title?: string }) {
  const formatted = data.map(d => ({ ...d, date: format(new Date(d.date), 'd MMM', { locale: uk }) }))
  return (
    <div className="iu-card p-6">
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="mono text-xs mb-6" style={{color:'rgba(255,255,255,0.3)'}}>За останні 30 днів</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e60000" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#e60000" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00c864" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00c864" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip contentStyle={{ background:'#161616', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#fff', fontSize:'13px' }} formatter={(v: number, n: string) => [`$${v.toFixed(0)}`, n === 'spend' ? 'Витрати' : 'Дохід']} />
          <Legend formatter={v => <span style={{color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>{v === 'spend' ? 'Витрати' : 'Дохід'}</span>} />
          <Area type="monotone" dataKey="spend" stroke="#e60000" strokeWidth={2} fill="url(#gSpend)" />
          <Area type="monotone" dataKey="revenue" stroke="#00c864" strokeWidth={2} fill="url(#gRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
