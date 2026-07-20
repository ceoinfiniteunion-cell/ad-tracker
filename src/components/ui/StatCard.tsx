import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: number
  color?: 'red' | 'white' | 'green' | 'blue'
  delay?: number
}

export function StatCard({ label, value, icon: Icon, trend, color = 'white', delay = 0 }: StatCardProps) {
  const iconColors: Record<string, string> = {
    red: 'rgba(230,0,0,0.15)',
    white: 'rgba(255,255,255,0.06)',
    green: 'rgba(0,200,100,0.12)',
    blue: 'rgba(0,100,255,0.12)',
  }
  const iconTextColors: Record<string, string> = {
    red: '#e60000',
    white: 'rgba(255,255,255,0.7)',
    green: '#00c864',
    blue: '#3b82f6',
  }

  return (
    <div className="iu-card p-5 animate-slide-up" style={{animationDelay:`${delay}ms`,opacity:0}}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:iconColors[color]}}>
          <Icon className="w-4 h-4" style={{color:iconTextColors[color]}} />
        </div>
        {trend !== undefined && (
          <span className="mono text-xs px-2 py-1 rounded" style={trend >= 0 ? {background:'rgba(0,200,100,0.1)',color:'#00c864'} : {background:'rgba(230,0,0,0.1)',color:'#ff6b6b'}}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs mt-1.5 uppercase tracking-wider font-medium" style={{color:'rgba(255,255,255,0.35)'}}>{label}</p>
    </div>
  )
}
