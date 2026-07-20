'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/ui/StatCard'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { DollarSign, Eye, MousePointer, ShoppingCart, Loader2 } from 'lucide-react'

const PLATFORM_LABELS: Record<Platform, string> = { FACEBOOK: 'Meta / Facebook', GOOGLE: 'Google Ads', TIKTOK: 'TikTok Ads' }
const PLATFORM_COLORS: Record<Platform, string> = { FACEBOOK: '#1877f2', GOOGLE: '#e60000', TIKTOK: '#fff' }

function mergeDailyMetrics(metrics: any[]) {
  const map: Record<string, any> = {}
  for (const m of metrics) {
    if (!map[m.date]) map[m.date] = { date: m.date, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    map[m.date].spend += m.spend; map[m.date].impressions += m.impressions; map[m.date].clicks += m.clicks; map[m.date].conversions += m.conversions; map[m.date].revenue += m.revenue
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | Platform>('all')

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex h-screen" style={{background:'#0a0a0a'}}>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-transparent rounded-full animate-spin mx-auto mb-4" style={{borderTopColor:'#e60000'}} />
          <p className="mono text-xs" style={{color:'rgba(255,255,255,0.3)'}}>Завантаження даних...</p>
        </div>
      </div>
    </div>
  )

  if (!data) return null
  const activePlatform = activeTab === 'all' ? null : data.platforms.find(p => p.platform === activeTab)
  const displaySummary = activePlatform ? activePlatform.summary : data.totals
  const displayDaily = activeTab === 'all' ? mergeDailyMetrics(data.platforms.map(p => p.daily).flat()) : activePlatform?.daily ?? []

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 animate-fade-in">
            <div>
              <p className="mono text-xs mb-2" style={{color:'rgba(255,255,255,0.3)'}}>// ПАНЕЛЬ АНАЛІТИКИ</p>
              <h1 className="text-2xl font-bold text-white">Вітаємо, {session?.user?.name}</h1>
              <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.4)'}}>{data.client.company} · Дані за останні 30 днів</p>
            </div>
            <div className="mono text-xs text-right" style={{color:'rgba(255,255,255,0.2)'}}>
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-red" style={{background:'#e60000'}} />
                LIVE
              </div>
              {new Date().toLocaleDateString('uk', { day:'2-digit', month:'short', year:'numeric' })}
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap animate-slide-up stagger-1">
            <button onClick={() => setActiveTab('all')} className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={activeTab === 'all' ? {background:'rgba(230,0,0,0.15)',color:'#ff4444',border:'1px solid rgba(230,0,0,0.3)'} : {background:'transparent',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.07)'}}>
              Всі платформи
            </button>
            {data.platforms.map(p => (
              <button key={p.platform} onClick={() => setActiveTab(p.platform)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2" style={activeTab === p.platform ? {background:'rgba(230,0,0,0.15)',color:'#ff4444',border:'1px solid rgba(230,0,0,0.3)'} : {background:'transparent',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <span className="w-2 h-2 rounded-full" style={{background:PLATFORM_COLORS[p.platform]}} />
                {PLATFORM_LABELS[p.platform]}
              </button>
            ))}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Витрати" value={formatCurrency(displaySummary.totalSpend)} icon={DollarSign} color="red" delay={0} />
            <StatCard label="Покази" value={formatNumber(displaySummary.totalImpressions)} icon={Eye} color="white" delay={50} />
            <StatCard label="Кліки" value={formatNumber(displaySummary.totalClicks)} icon={MousePointer} color="white" delay={100} />
            <StatCard label="Конверсії" value={formatNumber(displaySummary.totalConversions)} icon={ShoppingCart} color="green" delay={150} />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up stagger-4">
            {[
              { label: 'CTR', value: formatPercent(displaySummary.ctr), color: 'rgba(255,255,255,0.9)' },
              { label: 'CPC', value: formatCurrency(displaySummary.cpc), color: 'rgba(255,255,255,0.9)' },
              { label: 'ROAS', value: `${displaySummary.roas.toFixed(2)}×`, color: '#00c864' },
            ].map(({ label, value, color }) => (
              <div key={label} className="iu-card p-5 text-center">
                <p className="text-xl font-bold mono" style={{color}}>{value}</p>
                <p className="mono text-xs mt-1.5 uppercase tracking-wider" style={{color:'rgba(255,255,255,0.3)'}}>{label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-5">
            <SpendChart data={displayDaily} />
            <ClicksChart data={displayDaily} />
          </div>
        </div>
      </main>
    </div>
  )
}
