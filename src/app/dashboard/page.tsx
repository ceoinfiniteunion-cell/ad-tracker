'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatCard } from '@/components/ui/StatCard'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { DollarSign, Eye, MousePointer, ShoppingCart, Users, Play, Heart, TrendingUp } from 'lucide-react'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#fff' }

function merge(metrics: any[]) {
  const map: Record<string,any> = {}
  for (const m of metrics) {
    if (!map[m.date]) map[m.date] = { date:m.date, spend:0, impressions:0, clicks:0, conversions:0, revenue:0, reach:0, videoViews:0, leads:0 }
    map[m.date].spend+=m.spend; map[m.date].impressions+=m.impressions; map[m.date].clicks+=m.clicks
    map[m.date].conversions+=m.conversions; map[m.date].revenue+=m.revenue
    map[m.date].reach+=(m.reach??0); map[m.date].videoViews+=(m.videoViews??0); map[m.date].leads+=(m.leads??0)
  }
  return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date))
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all'|Platform>('all')

  useEffect(() => { fetch('/api/metrics').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) }) }, [])

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0a' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
        <div style={{ width:'36px', height:'36px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Завантаження даних...</p>
      </div>
    </div>
  )

  if (!data) return null
  const ap = activeTab==='all' ? null : data.platforms.find(p=>p.platform===activeTab)
  const summary = ap ? ap.summary : data.totals
  const daily = activeTab==='all' ? merge(data.platforms.map(p=>p.daily).flat()) : ap?.daily ?? []

  const tabStyle = (active: boolean) => ({
    padding:'8px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:500, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? 'rgba(230,0,0,0.12)' : 'transparent',
    color: active ? '#ff4444' : 'rgba(255,255,255,0.4)',
    borderColor: active ? 'rgba(230,0,0,0.3)' : 'rgba(255,255,255,0.07)',
  })

  const s = summary as any

  const metricBlock = (label: string, val: string, sub?: string, color='rgba(255,255,255,0.9)') => (
    <div key={label} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'18px 20px', textAlign:'center' }}>
      <p style={{ fontSize:'18px', fontWeight:800, fontFamily:'monospace', color, margin:0 }}>{val}</p>
      <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600 }}>{label}</p>
      {sub && <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', marginTop:'3px' }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', top:'-100px', right:'20%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(230,0,0,0.07) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// ПАНЕЛЬ АНАЛІТИКИ</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Вітаємо, {session?.user?.name}</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>{data.client.company} · Дані за останні 30 днів</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end', marginBottom:'4px' }}>
                <span className="anim-pulse" style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#e60000', display:'inline-block' }} />
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em' }}>LIVE</span>
              </div>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>{new Date().toLocaleDateString('uk',{day:'2-digit',month:'short',year:'numeric'})}</p>
            </div>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'28px', overflow:'hidden' }}>
            <svg width="100%" height="16" viewBox="0 0 1000 16" preserveAspectRatio="none">
              <path d="M0,8 C50,2 100,14 150,8 C200,2 250,14 300,8 C350,2 400,14 450,8 C500,2 550,14 600,8 C650,2 700,14 750,8 C800,2 850,14 900,8 C950,2 1000,14 1050,8" fill="none" stroke="rgba(230,0,0,0.25)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {/* Tabs */}
          <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'28px', flexWrap:'wrap' }}>
            <button onClick={()=>setActiveTab('all')} style={tabStyle(activeTab==='all')}>Всі платформи</button>
            {Array.from(new Map(data.platforms.map(p=>[p.platform,p])).values()).map(p=>(
              <button key={p.platform} onClick={()=>setActiveTab(p.platform)} style={{ ...tabStyle(activeTab===p.platform), display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }} />
                {PLABEL[p.platform]}
              </button>
            ))}
          </div>

          {/* Основні метрики */}
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', marginBottom:'12px' }}>// ОСНОВНІ ПОКАЗНИКИ</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'14px' }}>
            <StatCard label="Витрати" value={formatCurrency(s.totalSpend)} icon={DollarSign} color="red" delay={0} />
            <StatCard label="Покази" value={formatNumber(s.totalImpressions)} icon={Eye} color="white" delay={60} />
            <StatCard label="Кліки" value={formatNumber(s.totalClicks)} icon={MousePointer} color="white" delay={120} />
            <StatCard label="Конверсії" value={formatNumber(s.totalConversions)} icon={ShoppingCart} color="green" delay={180}/>
          </div>

          {/* Охоплення і відео */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'28px' }}>
            <StatCard label="Охоплення" value={formatNumber(s.totalReach ?? 0)} icon={Users} color="white" delay={0} />
            <StatCard label="Перегляди відео" value={formatNumber(s.totalVideoViews ?? 0)} icon={Play} color="white" delay={60} />
            <StatCard label="Ліди" value={formatNumber(s.totalLeads ?? 0)} icon={Heart} color="green" delay={120} />
            <StatCard label="Взаємодії" value={formatNumber(s.totalPostEngagement ?? 0)} icon={TrendingUp} color="white" delay={180} />
          </div>

          {/* Ефективність */}
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', marginBottom:'12px' }}>// ЕФЕКТИВНІСТЬ</p>
          <div className="anim-up-3" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'14px' }}>
            {metricBlock('CTR', formatPercent(s.ctr))}
            {metricBlock('CPC', formatCurrency(s.cpc))}
            {metricBlock('CPM', formatCurrency(s.cpm ?? 0), 'вартість 1000 показів')}
            {metricBlock('ROAS', `${(s.roas??0).toFixed(2)}×`, undefined, '#00c864')}
          </div>

          <div className="anim-up-3" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'28px' }}>
            {metricBlock('Ціна конверсії', formatCurrency(s.costPerConversion ?? 0))}
            {metricBlock('Ціна ліда', formatCurrency(s.costPerLead ?? 0))}
            {metricBlock('Частота', `${(s.frequency ?? 0).toFixed(2)}`, 'покази на користувача')}
            {metricBlock('Відео до кінця', formatPercent(s.videoCompletionRate ?? 0), 'completion rate')}
          </div>

          {/* Charts */}
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', marginBottom:'12px' }}>// ДИНАМІКА</p>
          <div className="anim-up-4" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <SpendChart data={daily} />
            <ClicksChart data={daily} />
          </div>

        </div>
      </main>
    </div>
  )
}
