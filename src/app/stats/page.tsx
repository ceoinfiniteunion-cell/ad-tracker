'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'rgba(255,255,255,0.7)' }
const PERIODS = [
  { label:'7 днів', days:7 },
  { label:'14 днів', days:14 },
  { label:'30 днів', days:30 },
  { label:'90 днів', days:90 },
]

function getFrom(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]
}

function merge(metrics: any[]) {
  const map: Record<string,any> = {}
  for (const m of metrics) {
    if (!map[m.date]) map[m.date] = { date:m.date, spend:0, impressions:0, clicks:0, conversions:0, revenue:0 }
    map[m.date].spend+=m.spend; map[m.date].impressions+=m.impressions; map[m.date].clicks+=m.clicks; map[m.date].conversions+=m.conversions; map[m.date].revenue+=m.revenue
  }
  return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date))
}

const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }

export default function StatsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [activePlatform, setActivePlatform] = useState<'all'|Platform>('all')
  const [activeAccount, setActiveAccount] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    const from = getFrom(period)
    const to = new Date().toISOString().split('T')[0]
    fetch(`/api/metrics?from=${from}&to=${to}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
  }, [period])

  const tabStyle = (active: boolean, color?: string) => ({
    padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? (color ? `${color}18` : 'rgba(230,0,0,0.12)') : 'transparent',
    color: active ? (color ?? '#ff4444') : 'rgba(255,255,255,0.4)',
    borderColor: active ? (color ? `${color}40` : 'rgba(230,0,0,0.3)') : 'rgba(255,255,255,0.07)',
  })

  // Фільтрація по платформі і кабінету
  const filteredPlatforms = !data ? [] : activePlatform === 'all'
    ? data.platforms
    : data.platforms.filter(p => p.platform === activePlatform)

  const displayPlatforms = activeAccount === 'all'
    ? filteredPlatforms
    : filteredPlatforms.filter(p => p.accountId === activeAccount)

  const summary = displayPlatforms.length === 0 ? null : {
    totalSpend: displayPlatforms.reduce((s,p)=>s+p.summary.totalSpend,0),
    totalImpressions: displayPlatforms.reduce((s,p)=>s+p.summary.totalImpressions,0),
    totalClicks: displayPlatforms.reduce((s,p)=>s+p.summary.totalClicks,0),
    totalConversions: displayPlatforms.reduce((s,p)=>s+p.summary.totalConversions,0),
    totalRevenue: displayPlatforms.reduce((s,p)=>s+p.summary.totalRevenue,0),
    ctr: 0, cpc: 0, roas: 0,
  } as any

  if (summary) {
    summary.ctr = summary.totalImpressions > 0 ? (summary.totalClicks/summary.totalImpressions)*100 : 0
    summary.cpc = summary.totalClicks > 0 ? summary.totalSpend/summary.totalClicks : 0
    summary.roas = summary.totalSpend > 0 ? summary.totalRevenue/summary.totalSpend : 0
  }

  const daily = merge(displayPlatforms.map(p=>p.daily).flat())

  // Унікальні кабінети для вибраної платформи
  const availableAccounts = !data ? [] : activePlatform === 'all'
    ? data.platforms
    : data.platforms.filter(p=>p.platform===activePlatform)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>
        <div style={{ position:'fixed', top:'-100px', right:'15%', width:'350px', height:'350px', borderRadius:'50%', background:'radial-gradient(circle,rgba(230,0,0,0.06) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// ДЕТАЛЬНА СТАТИСТИКА</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Статистика</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>{(session?.user as any)?.name} · {data?.client?.company}</p>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              {PERIODS.map(p=>(
                <button key={p.days} onClick={()=>setPeriod(p.days)} style={tabStyle(period===p.days)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'24px' }}>
            <svg width="100%" height="16" viewBox="0 0 1000 16" preserveAspectRatio="none">
              <path d="M0,8 C50,2 100,14 150,8 C200,2 250,14 300,8 C350,2 400,14 450,8 C500,2 550,14 600,8 C650,2 700,14 750,8 C800,2 850,14 900,8 C950,2 1000,14 1050,8" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {/* Фільтри — Платформа */}
          <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
            <button onClick={()=>{ setActivePlatform('all'); setActiveAccount('all') }} style={tabStyle(activePlatform==='all')}>Всі платформи</button>
            {data?.platforms.map(p=>(
              <button key={`${p.platform}-${p.accountId}`} onClick={()=>{ setActivePlatform(p.platform); setActiveAccount('all') }} style={{ ...tabStyle(activePlatform===p.platform, PCOLOR[p.platform]), display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }}/>
                {PLABEL[p.platform]}
              </button>
            ))}
          </div>

          {/* Фільтр — Конкретний кабінет */}
          {activePlatform !== 'all' && availableAccounts.length > 1 && (
            <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
              <button onClick={()=>setActiveAccount('all')} style={{ padding:'6px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s', background:activeAccount==='all'?'rgba(255,255,255,0.08)':'transparent', color:activeAccount==='all'?'#fff':'rgba(255,255,255,0.35)', borderColor:activeAccount==='all'?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)' }}>
                Всі кабінети
              </button>
              {availableAccounts.map(p=>(
                <button key={p.accountId} onClick={()=>setActiveAccount(p.accountId)} style={{ padding:'6px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s', background:activeAccount===p.accountId?'rgba(255,255,255,0.08)':'transparent', color:activeAccount===p.accountId?'#fff':'rgba(255,255,255,0.35)', borderColor:activeAccount===p.accountId?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)' }}>
                  {p.accountName} <span style={{ fontFamily:'monospace', fontSize:'10px', opacity:0.5 }}>· {p.accountId}</span>
                </button>
              ))}
            </div>
          )}

          {!activePlatform || activePlatform === 'all' ? <div style={{ marginBottom:'24px' }}/> : null}

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:'16px' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Завантаження статистики...</p>
            </div>
          ) : summary && (
            <>
              {/* Зведена таблиця */}
              <div className="anim-up-2" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>
                    Зведені метрики · {period} днів
                    {activeAccount !== 'all' && <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400 }}> · {availableAccounts.find(p=>p.accountId===activeAccount)?.accountName}</span>}
                  </p>
                  <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:0 }}>{getFrom(period)} → {new Date().toISOString().split('T')[0]}</p>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      {['Метрика','Значення','Деталі'].map(h=>(
                        <th key={h} style={{ padding:'12px 20px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric:'Витрати на рекламу', value:formatCurrency(summary.totalSpend), detail:`Дохід: ${formatCurrency(summary.totalRevenue)}`, color:'#e60000' },
                      { metric:'Покази', value:formatNumber(summary.totalImpressions), detail:'Унікальні покази оголошень', color:'rgba(255,255,255,0.7)' },
                      { metric:'Кліки', value:formatNumber(summary.totalClicks), detail:`CTR: ${formatPercent(summary.ctr)}`, color:'rgba(255,255,255,0.7)' },
                      { metric:'Конверсії', value:formatNumber(summary.totalConversions), detail:`Вартість: ${formatCurrency(summary.totalConversions>0 ? summary.totalSpend/summary.totalConversions : 0)}`, color:'#00c864' },
                      { metric:'CPC', value:formatCurrency(summary.cpc), detail:'Середня вартість кліку', color:'rgba(255,255,255,0.7)' },
                      { metric:'ROAS', value:`${summary.roas.toFixed(2)}×`, detail:`$1 витрат → $${summary.roas.toFixed(2)} доходу`, color: summary.roas>=2?'#00c864':summary.roas>=1?'#fbbf24':'#ff4444' },
                    ].map(row=>(
                      <tr key={row.metric} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                        onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                      >
                        <td style={{ padding:'14px 20px', fontSize:'13px', color:'rgba(255,255,255,0.5)', fontWeight:500 }}>{row.metric}</td>
                        <td style={{ padding:'14px 20px', fontSize:'15px', fontWeight:800, color:row.color, fontFamily:'monospace' }}>{row.value}</td>
                        <td style={{ padding:'14px 20px', fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Розбивка по платформах */}
              {activePlatform === 'all' && data && data.platforms.length > 1 && (
                <div className="anim-up-3" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Розбивка по платформах</p>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {['Платформа / Кабінет','Витрати','Покази','Кліки','CTR','CPC','ROAS'].map(h=>(
                          <th key={h} style={{ padding:'12px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.platforms.map(p=>{
                        const c = PCOLOR[p.platform]
                        return (
                          <tr key={`${p.platform}-${p.accountId}`} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s', cursor:'pointer' }}
                            onClick={()=>{ setActivePlatform(p.platform); setActiveAccount(p.accountId) }}
                            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                          >
                            <td style={{ padding:'14px 16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:c, display:'inline-block', flexShrink:0 }}/>
                                <div>
                                  <p style={{ fontSize:'13px', fontWeight:600, color:'#fff', margin:0 }}>{p.accountName}</p>
                                  <p style={{ fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.25)', margin:'2px 0 0' }}>{PLABEL[p.platform]} · {p.accountId}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'#e60000', fontWeight:700 }}>{formatCurrency(p.summary.totalSpend)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>{formatNumber(p.summary.totalImpressions)}</td>
                            <td style={{ padding:'14font-16px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>{formatNumber(p.summary.totalClicks)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>{formatPercent(p.summary.ctr)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.6)' }}>{formatCurrency(p.summary.cpc)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:700, color: p.summary.roas>=2?'#00c864':p.summary.roas>=1?'#fbbf24':'#ff4444' }}>{p.summary.roas.toFixed(2)}×</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Графіки */}
              <div className="anim-up-4" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <SpendChart data={daily} />
                <ClicksChart data={daily} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
