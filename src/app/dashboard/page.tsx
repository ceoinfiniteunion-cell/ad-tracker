'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/ui/StatCard'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import {
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  TrendingUp,
  Loader2,
} from 'lucide-react'

const PLATFORM_LABELS: Record<Platform, string> = {
  FACEBOOK: 'Facebook / Instagram',
  GOOGLE: 'Google Ads',
  TIKTOK: 'TikTok Ads',
}

const PLATFORM_COLORS: Record<Platform, string> = {
  FACEBOOK: 'bg-blue-500',
  GOOGLE: 'bg-red-500',
  TIKTOK: 'bg-black',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | Platform>('all')

  useEffect(() => {
    fetch('/api/metrics')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const activePlatform =
    activeTab === 'all' ? null : data.platforms.find((p) => p.platform === activeTab)

  const displaySummary = activePlatform ? activePlatform.summary : data.totals
  const displayDaily =
    activeTab === 'all'
      ? mergeDailyMetrics(data.platforms.map((p) => p.daily).flat())
      : activePlatform?.daily ?? []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Вітаємо, {session?.user?.name} 👋
            </h1>
            <p className="text-gray-500 mt-1">{data.client.company} — Дані за останні 30 днів</p>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Всі платформи
            </button>
            {data.platforms.map((p) => (
              <button
                key={p.platform}
                onClick={() => setActiveTab(p.platform)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  activeTab === p.platform
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[p.platform]}`} />
                {PLATFORM_LABELS[p.platform]}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Витрати на рекламу"
              value={formatCurrency(displaySummary.totalSpend)}
              icon={DollarSign}
              color="blue"
            />
            <StatCard
              label="Покази"
              value={formatNumber(displaySummary.totalImpressions)}
              icon={Eye}
              color="purple"
            />
            <StatCard
              label="Кліки"
              value={formatNumber(displaySummary.totalClicks)}
              icon={MousePointer}
              color="orange"
            />
            <StatCard
              label="Конверсії"
              value={formatNumber(displaySummary.totalConversions)}
              icon={ShoppingCart}
              color="green"
            />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{formatPercent(displaySummary.ctr)}</p>
              <p className="text-sm text-gray-500 mt-1">CTR</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(displaySummary.cpc)}</p>
              <p className="text-sm text-gray-500 mt-1">CPC</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{displaySummary.roas.toFixed(2)}x</p>
              <p className="text-sm text-gray-500 mt-1">ROAS</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendChart data={displayDaily} />
            <ClicksChart data={displayDaily} />
          </div>
        </div>
      </main>
    </div>
  )
}

// Об'єднуємо дані по всіх платформах по даті
function mergeDailyMetrics(metrics: any[]) {
  const map: Record<string, any> = {}
  for (const m of metrics) {
    if (!map[m.date]) {
      map[m.date] = { date: m.date, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    }
    map[m.date].spend += m.spend
    map[m.date].impressions += m.impressions
    map[m.date].clicks += m.clicks
    map[m.date].conversions += m.conversions
    map[m.date].revenue += m.revenue
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}
