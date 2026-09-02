'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Settings2, X, Check } from 'lucide-react'
import { GoalsSection } from '@/components/ui/GoalsSection'
import { CommentsSection } from '@/components/ui/CommentsSection'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#fff' }

const PLATFORM_METRICS: Record<string, { key: string; label: string; format: 'currency'|'number'|'percent'|'x'|'raw'; platforms: Platform[] }[]> = {
  common: [
    { key:'totalSpend', label:'Витрати', format:'currency', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'totalImpressions', label:'Покази', format:'number', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'totalClicks', label:'Кліки', format:'number', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'totalConversions', label:'Конверсії', format:'number', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'totalRevenue', label:'Дохід', format:'currency', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'ctr', label:'CTR', format:'percent', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'cpc', label:'CPC', format:'currency', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'roas', label:'ROAS', format:'x', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
    { key:'costPerConversion', label:'Ціна конверсії', format:'currency', platforms:['FACEBOOK','GOOGLE','TIKTOK'] },
  ],
  meta: [
    { key:'totalReach', label:'Охоплення (Reach)', format:'number', platforms:['FACEBOOK'] },
    { key:'frequency', label:'Частота (Frequency)', format:'raw', platforms:['FACEBOOK'] },
    { key:'cpm', label:'CPM', format:'currency', platforms:['FACEBOOK'] },
    { key:'cpp', label:'CPP', format:'currency', platforms:['FACEBOOK'] },
    { key:'totalLeads', label:'Ліди', format:'number', platforms:['FACEBOOK'] },
    { key:'costPerLead', label:'Ціна ліда (CPL)', format:'currency', platforms:['FACEBOOK'] },
    { key:'totalVideoViews', label:'Перегляди відео', format:'number', platforms:['FACEBOOK'] },
    { key:'videoCompletionRate', label:'Completion Rate', format:'percent', platforms:['FACEBOOK'] },
    { key:'totalPostEngagement', label:'Post Engagement', format:'number', platforms:['FACEBOOK'] },
    { key:'totalLinkClicks', label:'Link Clicks', format:'number', platforms:['FACEBOOK'] },
    { key:'totalLandingPageViews', label:'Landing Page Views', format:'number', platforms:['FACEBOOK'] },
    { key:'totalComments', label:'Коментарі', format:'number', platforms:['FACEBOOK'] },
    { key:'totalShares', label:'Поширення', format:'number', platforms:['FACEBOOK'] },
  ],
  google: [
    { key:'totalReach', label:'Охоплення', format:'number', platforms:['GOOGLE'] },
    { key:'cpm', label:'CPM', format:'currency', platforms:['GOOGLE'] },
    { key:'totalVideoViews', label:'Перегляди відео', format:'number', platforms:['GOOGLE'] },
    { key:'costPerConversion', label:'Cost per Conversion', format:'currency', platforms:['GOOGLE'] },
  ],
  tiktok: [
    { key:'totalReach', label:'Охоплення (Reach)', format:'number', platforms:['TIKTOK'] },
    { key:'frequency', label:'Частота (Frequency)', format:'raw', platforms:['TIKTOK'] },
    { key:'cpm', label:'CPM', format:'currency', platforms:['TIKTOK'] },
    { key:'totalLeads', label:'Конверсії', format:'number', platforms:['TIKTOK'] },
    { key:'costPerLead', label:'Cost per Conversion', format:'currency', platforms:['TIKTOK'] },
    { key:'totalVideoViews', label:'Video Views', format:'number', platforms:['TIKTOK'] },
    { key:'videoCompletionRate', label:'Completion Rate', format:'percent', platforms:['TIKTOK'] },
    { key:'totalPostEngagement', label:'Engagement', format:'number', platforms:['TIKTOK'] },
    { key:'totalComments', label:'Коментарі', format:'number', platforms:['TIKTOK'] },
    { key:'totalShares', label:'Поширення', format:'number', platforms:['TIKTOK'] },
  ],
}

const DEFAULT_METRICS = ['totalSpend','totalImpressions','totalClicks','totalConversions','ctr','cpc','roas']

function formatVal(val: any, format: string, currency = 'USD', rate = 1) {
  if (val === undefined || val === null) return '—'
  switch(format) {
    case 'currency': return formatCurrency(Number(val) * rate, currency)
    case 'number': return formatNumber(val)
    case 'percent': return formatPercent(val)
    case 'x': return `${Number(val).toFixed(2)}×`
    case 'raw': return Number(val).toFixed(2)
    default: return String(val)
  }
}

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
  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [activeTab, setActiveTab] = useState<'all'|Platform>('all')
  const [customize, setCustomize] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_metrics')
    if (saved) setSelectedMetrics(JSON.parse(saved))
    // Завантажити валюту спочатку, потім дані
    fetch('/api/profile').then(r=>r.json()).then(async d => {
      const cur = d.client?.currency ?? 'USD'
      setCurrency(cur)
      if (cur !== 'USD') {
        try {
          const rateRes = await fetch('/api/currency?to=' + cur)
          const rateData = await rateRes.json()
          setExchangeRate(rateData.rate ?? 1)
        } catch {}
      }
    }).catch(() => {}).finally(() => {
      fetch('/api/metrics').then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
    })
  }, [])

  const toggleMetric = (key: string) => {
    const next = selectedMetrics.includes(key) ? selectedMetrics.filter(k=>k!==key) : [...selectedMetrics, key]
    setSelectedMetrics(next)
    localStorage.setItem('dashboard_metrics', JSON.stringify(next))
  }

  const SkeletonBlock = ({ w='100%', h='20px', r='8px' }: { w?:string, h?:string, r?:string }) => (
    <div style={{ width:w, height:h, borderRadius:r, background:'var(--bg3)', backgroundImage:'linear-gradient(90deg,var(--bg3) 0%,var(--bg2) 50%,var(--bg3) 100%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }}/>
  )

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto', padding: isMobile ? '16px' : '36px 40px' }}>
        <div style={{ marginBottom:'32px' }}>
          <SkeletonBlock w='120px' h='11px' r='4px'/>
          <div style={{ marginTop:'12px' }}><SkeletonBlock w='280px' h='32px' r='8px'/></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'14px', marginBottom:'28px' }}>
          {[...Array(4)].map((_,i) => (
            <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'26px' }}>
              <SkeletonBlock w='60px' h='11px' r='4px'/>
              <div style={{ marginTop:'14px' }}><SkeletonBlock w='140px' h='28px' r='6px'/></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  if (!data) return null

  const ap = activeTab==='all' ? null : data.platforms.find(p=>p.platform===activeTab)
  const summary: any = ap ? ap.summary : data.totals
  const daily = activeTab==='all' ? merge(data.platforms.map(p=>p.daily).flat()) : ap?.daily ?? []
  const uniquePlatforms = Object.values(
    data.platforms.reduce((acc: any, p) => {
      if (!acc[p.platform] || p.daily.length > acc[p.platform].daily.length) acc[p.platform] = p
      return acc
    }, {})
  ) as typeof data.platforms

  const platformGroups = activeTab === 'all' ? uniquePlatforms : uniquePlatforms.filter(p=>p.platform===activeTab)

  const tabStyle = (active: boolean) => ({
    padding: isMobile ? '8px 12px' : '10px 20px',
    borderRadius:'12px', fontSize: isMobile ? '13px' : '15px', fontWeight:500 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? 'rgba(230,0,0,0.12)' : 'transparent',
    color: active ? '#ff4444' : 'var(--text3)',
    borderColor: active ? 'rgba(230,0,0,0.3)' : 'var(--border)',
  })

  const getMetricsForPlatform = (platform: Platform) => {
    const platformKey = platform === 'FACEBOOK' ? 'meta' : platform === 'GOOGLE' ? 'google' : 'tiktok'
    return [...PLATFORM_METRICS.common, ...PLATFORM_METRICS[platformKey]].filter(m=>selectedMetrics.includes(m.key))
  }

  const commonSelected = PLATFORM_METRICS.common.filter(m=>selectedMetrics.includes(m.key))

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: isMobile ? '20px' : '32px', gap:'12px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// ПАНЕЛЬ АНАЛІТИКИ</p>
              <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Вітаємо, {session?.user?.name}</h1>
              {!isMobile && <p style={{ fontSize:'15px', color:'var(--text3)', marginTop:'6px' }}>{data.client.company} · Дані за останні 90 днів</p>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <button onClick={()=>setCustomize(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding: isMobile ? '8px 12px' : '10px 20px', borderRadius:'12px', border:'1px solid var(--border2)', background:'var(--bg2)', color:'var(--text2)', fontSize: isMobile ? '13px' : '15px', fontWeight:500, cursor:'pointer' }}>
                <Settings2 size={14}/>{!isMobile && ' Customize'}
              </button>
              {!isMobile && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'flex-end', marginBottom:'4px' }}>
                    <span className="anim-pulse" style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#e60000', display:'inline-block' }}/>
                    <span style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', letterSpacing:'0.1em' }}>LIVE</span>
                  </div>
                  <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)' }}>{new Date().toLocaleDateString('uk',{day:'2-digit',month:'short',year:'numeric'})}</p>
                </div>
              )}
            </div>
          </div>

          {/* Цілі */}
          <GoalsSection totals={data.totals} />

          {/* Коментарі */}
          <CommentsSection clientId={(session?.user as any)?.clientId ?? ''} isAdmin={false} />

          {/* Tabs */}
          <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
            <button onClick={()=>setActiveTab('all')} className="btn-ripple" style={tabStyle(activeTab==='all')}>Всі платформи</button>
            {uniquePlatforms.map(p=>(
              <button key={p.platform} onClick={()=>setActiveTab(p.platform)} className="btn-ripple" style={{ ...tabStyle(activeTab===p.platform), display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }}/>
                {isMobile ? (p.platform === 'FACEBOOK' ? 'Meta' : p.platform === 'GOOGLE' ? 'Google' : 'TikTok') : PLABEL[p.platform]}
              </button>
            ))}
          </div>

          {/* Загальні метрики */}
          {activeTab === 'all' && commonSelected.length > 0 && (
            <>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', marginBottom:'12px' }}>// ЗАГАЛЬНІ ПОКАЗНИКИ</p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px', marginBottom:'24px' }}>
                {commonSelected.map(m => (
                  <div key={m.key} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'16px', padding: isMobile ? '14px' : '16px 20px' }}>
                    <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight:800, fontFamily:'monospace', color: m.key==='roas'?(summary[m.key]>=2?'#00c864':summary[m.key]>=1?'#fbbf24':'#ff4444'): m.key==='totalSpend'?'#e60000':'var(--text)', margin:0 }}>{formatVal(summary[m.key], m.format)}</p>
                    <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Секції по платформах */}
          {platformGroups.map(p => {
            const metricsToShow = getMetricsForPlatform(p.platform)
            if (metricsToShow.length === 0) return null
            const color = PCOLOR[p.platform]
            const platformSummary: any = activeTab === 'all'
              ? data.platforms.filter(x=>x.platform===p.platform).reduce((acc, x) => {
                  const s: any = x.summary
                  Object.keys(s).forEach(k => { acc[k] = (acc[k]||0) + (typeof s[k]==='number'?s[k]:0) })
                  return acc
                }, {} as any)
              : p.summary

            if (activeTab === 'all') {
              platformSummary.ctr = platformSummary.totalImpressions > 0 ? (platformSummary.totalClicks/platformSummary.totalImpressions)*100 : 0
              platformSummary.cpc = platformSummary.totalClicks > 0 ? platformSummary.totalSpend/platformSummary.totalClicks : 0
              platformSummary.roas = platformSummary.totalSpend > 0 ? platformSummary.totalRevenue/platformSummary.totalSpend : 0
              platformSummary.costPerConversion = platformSummary.totalConversions > 0 ? platformSummary.totalSpend/platformSummary.totalConversions : 0
              platformSummary.costPerLead = platformSummary.totalLeads > 0 ? platformSummary.totalSpend/platformSummary.totalLeads : 0
            }

            return (
              <div key={p.platform} style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:color, display:'inline-block' }}/>
                  <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text3)', margin:0, textTransform:'uppercase' }}>{PLABEL[p.platform]}</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap:'10px' }}>
                  {metricsToShow.map(m => (
                    <div key={m.key} style={{ background:'var(--bg2)', border:`1px solid ${color}15`, borderRadius:'10px', padding: isMobile ? '12px 14px' : '14px 18px' }}>
                      <p style={{ fontSize: isMobile ? '15px' : '18px', fontWeight:800, fontFamily:'monospace', color: m.key==='roas'?(platformSummary[m.key]>=2?'#00c864':platformSummary[m.key]>=1?'#fbbf24':'#ff4444'): m.key==='totalSpend'?'#e60000':'var(--text)', margin:0 }}>{formatVal(platformSummary[m.key], m.format)}</p>
                      <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Charts */}
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', marginBottom:'12px' }}>// ДИНАМІКА</p>
          <div className="anim-up-4" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' }}>
            <SpendChart data={daily} platformData={activeTab==='all' && uniquePlatforms.length>1 ? uniquePlatforms.map(p=>({ platform:p.platform, color:PCOLOR[p.platform], label:PLABEL[p.platform], daily:p.daily })) : undefined}/>
            <ClicksChart data={daily} platformData={activeTab==='all' && uniquePlatforms.length>1 ? uniquePlatforms.map(p=>({ platform:p.platform, color:PCOLOR[p.platform], label:PLABEL[p.platform], daily:p.daily })) : undefined}/>
          </div>
        </div>
      </main>

      {/* Customize панель */}
      {customize && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={()=>setCustomize(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)' }}/>
          <div style={{ position:'absolute', right:0, top:0, bottom:0, width: isMobile ? '100%' : '400px', background:'var(--bg2)', borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h2 style={{ fontSize:'18px', fontWeight:800, color:'var(--text)', margin:0 }}>Customize метрики</h2>
              <button onClick={()=>setCustomize(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={18}/></button>
            </div>
            {['common','meta','google','tiktok'].map(section => (
              <div key={section} style={{ marginBottom:'24px' }}>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text3)', marginBottom:'12px', textTransform:'uppercase' }}>
                  {section === 'common' ? 'Загальні' : section === 'meta' ? 'Meta / Facebook' : section === 'google' ? 'Google Ads' : 'TikTok Ads'}
                </p>
                {PLATFORM_METRICS[section].map(m=>(
                  <label key={m.key+m.label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', borderRadius:'12px', cursor:'pointer', marginBottom:'4px' }}>
                    <div onClick={()=>toggleMetric(m.key)} style={{ width:'18px', height:'18px', borderRadius:'5px', border:`1px solid ${selectedMetrics.includes(m.key)?'#e60000':'var(--border)'}`, background: selectedMetrics.includes(m.key)?'rgba(230,0,0,0.15)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
                      {selectedMetrics.includes(m.key) && <Check size={11} color="#e60000"/>}
                    </div>
                    <span style={{ fontSize:'15px', color: selectedMetrics.includes(m.key)?'var(--text)':'var(--text3)', fontWeight: selectedMetrics.includes(m.key)?600:400 }}>{m.label}</span>
                  </label>
                ))}
              </div>
            ))}
            <button onClick={()=>{ setSelectedMetrics(DEFAULT_METRICS); localStorage.setItem('dashboard_metrics', JSON.stringify(DEFAULT_METRICS)) }}
              style={{ width:'100%', padding:'10px', borderRadius:'12px', border:'1px solid var(--border2)', background:'transparent', color:'var(--text3)', fontSize:'15px', cursor:'pointer' }}>
              Скинути до стандартних
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
