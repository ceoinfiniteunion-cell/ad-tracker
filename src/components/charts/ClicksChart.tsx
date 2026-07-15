'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyMetric } from '@/types'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

interface ClicksChartProps {
  data: DailyMetric[]
}

export function ClicksChart({ data }: ClicksChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), 'd MMM', { locale: uk }),
  }))

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Кліки та конверсії</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            formatter={(value: number, name: string) => [
              value.toLocaleString('uk-UA'),
              name === 'clicks' ? 'Кліки' : 'Конверсії',
            ]}
          />
          <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="conversions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
