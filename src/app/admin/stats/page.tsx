'use client'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { ChevronDown, Users } from 'lucide-react'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }
const PERIODS = [{ label:'7 днів', days:7 },{ label:'14 днів', days:14 },{ label:'30 днів', days:30 },{ label:'90 днів', days:90 }]

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

export default function AdminStatsPage() {
  const [clients, setClients] = useState<{id:string;name:string;company:string}[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState(30)
  const [activePlatform, setActivePlatform] = useState<'all'|Platform>('all')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<DOMRect|null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/clients/list').then(r=>r.json()).then(d=>{ setClients(d); if(d.length>0) setSelectedClient(d[0].id) })
  }, [])

  useEffect(() => {
    if (!selectedClient) return
    setLoading(true); setData(null); setActivePlatform('all')
    fetch(`/api/metrics?clientId=${selectedClient}&from=${getFrom(period)}&to=${new Date().toISOString().split('T')[0]}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
  }, [selectedClient, period])

  const openDropdown = () => {
    if (btnRef.current) setDropdownRect(btnRef.current.getBoundingClientRect())
    setShowDropdown(v=>!v)
  }

  const tabStyle = (active: boolean, color?: string) => ({
    padding: isMobile ? '6px 10px' : '7px 14px',
    borderRadius:'7px', fontSize: isMobile ? '11px' : '12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? (color ? `${color}18` : 'rgba(230,0,0,0.12)') : 'transparent',
    color: active ? (color ?? '#ff4444') : 'var(--text3)',
    borderColor: active ? (color ? `${color}40` : 'rgba(230,0,0,0.3)') : 'var(--border)',
  })

  const ap = activePlatform==='all' ? null : data?.platforms.find(p=>p.platform===activePlatform)
  const summary = ap ? ap.summary : data?.totals
  const daily = !data ? [] : activePlatform==='all' ? merge(data.platforms.map(p=>p.daily).flat()) : ap?.daily ?? []
  const currentClient = clients.find(c=>c.id===selectedClient)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ marginBottom:'24px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// АДМІН · СТАТИСТИКА</p>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Статистика клієнта</h1>
                {currentClient && <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>{currentClient.company}</p>}
              </div>
              <button ref={btnRef} onClick={openDropdown}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', fontWeight:600, cursor:'pointer', minWidth: isMobile ? '140px' : '180px', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                  <Users size={13} style={{color:'var(--text3)'}}/>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: isMobile ? '90px' : '140px' }}>{currentClient?.name ?? 'Виберіть'}</span>
                </div>
                <ChevronDown size={13} style={{ color:'var(--text3)', transform: showDropdown?'rotate(180deg)':'none', transition:'transform 0.2s', flexShrink:0 }}/>
              </button>
            </div>
            <div style={{ display:'flex', gap:'6px', marginTop:'16px', flexWrap:'wrap' }}>
              {PERIODS.map(p=>(
                <button key={p.days} onClick={()=>setPeriod(p.days)} style={tabStyle(period===p.days)}>{p.label}</button>
              ))}
            </div>
          </div>

          {/* Portal dropdown */}
          {showDropdown && dropdownRect && typeof document !== 'undefined' && createPortal(
            <>
              <div style={{ position:'fixed', inset:0, zIndex:99998 }} onClick={()=>setShowDropdown(false)}/>
              <div style={{
                position:'fixed',
                top: dropdownRect.bottom + 6,
                left: isMobile ? 16 : dropdownRect.left,
                right: isMobile ? 16 : 'auto',
                width: isMobile ? 'auto' : dropdownRect.width,
                minWidth: isMobile ? 'auto' : '180px',
                background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px',
                boxShadow:'0 16px 48px rgba(0,0,0,0.8)', zIndex:99999, overflow:'auto', maxHeight:'280px'
              }}>
                {clients.map((c,i)=>(
                  <button key={c.id}
                    onClick={()=>{ setSelectedClient(c.id); setShowDropdown(false) }}
                    style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'12px 16px', background: selectedClient===c.id ? 'rgba(230,0,0,0.1)' : 'transparent', border:'none', borderBottom: i<clients.length-1 ? '1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', textAlign:'left' as const }}
                  >
                    <span style={{ fontSize:'13px', fontWeight:600, color: selectedClient===c.id ? '#ff4444' : 'var(--text)' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}

          {clients.length === 0 ? (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'60px', textAlign:'center' }}>
              <Users size={36} style={{ color:'var(--border)', margin:'0 auto 16px' }}/>
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', margin:0 }}>Немає клієнтів</p>
            </div>
          ) : (
            <>
              <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
                <button onClick={()=>setActivePlatform('all')} style={tabStyle(activePlatform==='all')}>Всі платформи</button>
                {Array.from(new Map(data?.platforms.map(p=>[p.platform,p])).values()).map(p=>(
                  <button key={p.platform} onClick={()=>setActivePlatform(p.platform)} style={{ ...tabStyle(activePlatform===p.platform, PCOLOR[p.platform]), display:'flex', alignItems:'center', gap:'7px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }}/>
                    {isMobile ? (p.platform==='FACEBOOK'?'Meta':p.platform==='GOOGLE'?'Google':'TikTok') : PLABEL[p.platform]}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:'16px' }}>
                  <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                </div>
              ) : summary && (
                <>
                  <div className="anim-up-2" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                    <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                      <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Метрики · {period} днів · {currentClient?.name}</p>
                      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:0 }}>{getFrom(period)} → {new Date().toISOString().split('T')[0]}</p>
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          {(isMobile ? ['Метрика','Значення'] : ['Метрика','Значення','Деталі']).map((h,hi)=>(
                            <th key={h} style={{ padding: isMobile ? '10px 14px' : '12px 20px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', width: isMobile ? (hi===0 ? '55%' : '45%') : 'auto' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { metric:'Витрати на рекламу', value:formatCurrency(summary.totalSpend), detail:`Дохід: ${formatCurrency(summary.totalRevenue)}`, color:'#e60000' },
                          { metric:'Покази', value:formatNumber(summary.totalImpressions), detail:'Унікальні покази оголошень', color:'var(--text2)' },
                          { metric:'Кліки', value:formatNumber(summary.totalClicks), detail:`CTR: ${formatPercent(summary.ctr)}`, color:'var(--text2)' },
                          { metric:'Конверсії', value:formatNumber(summary.totalConversions), detail:`Вартість: ${formatCurrency(summary.totalConversions>0?summary.totalSpend/summary.totalConversions:0)}`, color:'#00c864' },
                          { metric:'CPC', value:formatCurrency(summary.cpc), detail:'Середня вартість кліку', color:'var(--text2)' },
                          { metric:'ROAS', value:`${summary.roas.toFixed(2)}×`, detail:`$1 витрат → $${summary.roas.toFixed(2)} доходу`, color:summary.roas>=2?'#00c864':summary.roas>=1?'#fbbf24':'#ff4444' },
                        ].map(row=>(
                          <tr key={row.metric} style={{ borderBottom:'1px solid var(--border)' }}>
                            <td style={{ padding: isMobile ? '12px 14px' : '14px 20px', fontSize:'13px', color:'var(--text)', fontWeight:600 }}>{row.metric}</td>
                            <td style={{ padding: isMobile ? '12px 14px' : '14px 20px', fontSize:'14px', fontWeight:800, color:row.color, fontFamily:'monospace' }}>{row.value}</td>
                            {!isMobile && <td style={{ padding:'14px 20px', fontSize:'13px', fontWeight:600, color:'var(--text2)', fontFamily:'monospace' }}>{row.detail}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {activePlatform==='all' && data && data.platforms.length>1 && (
                    <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
                        <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Розбивка по платформах</p>
                      </div>
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
                          <thead>
                            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                              {['Платформа','Витрати','Покази','Кліки','CTR','CPC','ROAS'].map(h=>(
                                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', whiteSpace:'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.platforms.map(p=>{
                              const c=PCOLOR[p.platform]
                              return (
                                <tr key={p.platform} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }} onClick={()=>setActivePlatform(p.platform)}>
                                  <td style={{ padding:'14px 16px' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:c, flexShrink:0, display:'inline-block' }}/>
                                      <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap' }}>{PLABEL[p.platform]}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'#e60000', fontWeight:700, whiteSpace:'nowrap' }}>{formatCurrency(p.summary.totalSpend)}</td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatNumber(p.summary.totalImpressions)}</td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatNumber(p.summary.totalClicks)}</td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatPercent(p.summary.ctr)}</td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatCurrency(p.summary.cpc)}</td>
                                  <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:700, whiteSpace:'nowrap', color:p.summary.roas>=2?'#00c864':p.summary.roas>=1?'#fbbf24':'#ff4444' }}>{p.summary.roas.toFixed(2)}×</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="anim-up-4" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' }}>
                    <SpendChart data={daily} title="Витрати та дохід"/>
                    <ClicksChart data={daily} title="Кліки та конверсії"/>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
