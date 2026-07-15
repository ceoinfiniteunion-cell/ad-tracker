'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

interface SpendChartProps {
  data: DailyMetric[]
  title?: string
}

export function SpendChart({ data, title = 'Витрати та дохід' }: SpendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), 'd MMM', { locale: uk }),
  }))

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            formatter={(value: number, name: string) => [
              `$${value.toFixed(0)}`,
              name === 'spend' ? 'Витрати' : 'Дохід',
            ]}
          />
          <Legend formatter={(v) => (v === 'spend' ? 'Витрати' : 'Дохід')} />
          <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fill="url(#colorSpend)" />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
