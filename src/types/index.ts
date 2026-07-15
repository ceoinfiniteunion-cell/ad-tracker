export type Platform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK'
export type Role = 'ADMIN' | 'CLIENT'

export interface MetricsSummary {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  ctr: number
  cpc: number
  roas: number
}

export interface DailyMetric {
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

export interface PlatformMetrics {
  platform: Platform
  accountName: string
  accountId: string
  summary: MetricsSummary
  daily: DailyMetric[]
}

export interface ClientDashboardData {
  client: {
    id: string
    name: string
    company: string
  }
  dateRange: { from: string; to: string }
  platforms: PlatformMetrics[]
  totals: MetricsSummary
}
