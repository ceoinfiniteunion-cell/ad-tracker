'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Calendar, Download, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useRef } from 'react'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }

const PRESETS = [
  { label:'7 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-7); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'14 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-14); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'30 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-30); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'90 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-90); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'Цей місяць', getValue: () => { const d=new Date(); return {from:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,to:d.toISOString().split('T')[0]} } },
]

function merge(metrics: any[]) {
  const map: Record<string,any> = {}
  for (const m of metrics) {
    if (!map[m.date]) map[m.date] = { date:m.date, spend:0, impressions:0, clicks:0, conversions:0, revenue:0 }
    map[m.date].spend+=m.spend; map[m.date].impressions+=m.impressions; map[m.date].clicks+=m.clicks; map[m.date].conversions+=m.conversions; map[m.date].revenue+=m.revenue
  }
  return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date))
}

function Trend({ curr, prev }: { curr:number; prev:number }) {
  if (!prev) return <span style={{color:'var(--text4)',fontSize:'11px',fontFamily:'monospace'}}>—</span>
  const pct = ((curr-prev)/prev)*100
  const up = pct >= 0
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'11px', fontFamily:'monospace', fontWeight:700, color: up?'#00c864':'#ff4444' }}>
      {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
      {up?'+':''}{pct.toFixed(1)}%
    </span>
  )
}

const inpStyle = { padding:'10px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', cursor:'pointer', fontFamily:'monospace' }

export default function AdminReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const d30 = new Date(); d30.setDate(d30.getDate()-30)

  const [clients, setClients] = useState<{id:string;name:string;company:string}[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [from, setFrom] = useState(d30.toISOString().split('T')[0])
  const [to, setTo] = useState(today)
  const [activePreset, setActivePreset] = useState('30 днів')
  const [activePlatform, setActivePlatform] = useState<'all'|Platform>('all')
  const [data, setData] = useState<ClientDashboardData|null>(null)
  const [prevData, setPrevData] = useState<ClientDashboardData|null>(null)
  const [loading, setLoading] = useState(false)
  const [compare, setCompare] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownRect, setDropdownRect] = useState<DOMRect|null>(null)
  const dropdownBtnRef = useRef<HTMLButtonElement>(null)
  const [isMobile, setIsMobile] = useState(false)

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
    const load = async () => {
      const res = await fetch(`/api/metrics?clientId=${selectedClient}&from=${from}&to=${to}`)
      setData(await res.json())
      if (compare) {
        const days = Math.ceil((new Date(to).getTime()-new Date(from).getTime())/(1000*60*60*24))
        const pf = new Date(from); pf.setDate(pf.getDate()-days-1)
        const pt = new Date(from); pt.setDate(pt.getDate()-1)
        const res2 = await fetch(`/api/metrics?clientId=${selectedClient}&from=${pf.toISOString().split('T')[0]}&to=${pt.toISOString().split('T')[0]}`)
        setPrevData(await res2.json())
      }
      setLoading(false)
    }
    load()
  }, [selectedClient, from, to, compare])

  const applyPreset = (p: typeof PRESETS[0]) => { const {from:f,to:t}=p.getValue(); setFrom(f); setTo(t); setActivePreset(p.label) }

  const exportCSV = () => {
    if (!data) return
    const ap = activePlatform==='all' ? null : data.platforms.find(p=>p.platform===activePlatform)
    const daily = activePlatform==='all' ? merge(data.platforms.map(p=>p.daily).flat()) : ap?.daily ?? []
    const rows = [['Дата','Витрати','Покази','Кліки','Конверсії','Дохід'], ...daily.map(d=>[d.date,d.spend.toFixed(2),d.impressions,d.clicks,d.conversions,d.revenue.toFixed(2)])]
    const blob = new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\n')], {type:'text/csv;charset=utf-8'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download=`report-${currentClient?.name}-${from}-${to}.csv`; a.click()
  }

  const tabStyle = (active: boolean, color?: string) => ({
    padding: isMobile ? '6px 10px' : '7px 14px',
    borderRadius:'7px', fontSize: isMobile ? '11px' : '12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active?(color?`${color}18`:'rgba(230,0,0,0.12)'):'transparent',
    color: active?(color??'#ff4444'):'var(--text3)',
    borderColor: active?(color?`${color}40`:'rgba(230,0,0,0.3)'):'var(--border)',
  })

  const currentClient = clients.find(c=>c.id===selectedClient)
  const ap = activePlatform==='all' ? null : data?.platforms.find(p=>p.platform===activePlatform)
  const summary = ap ? ap.summary : data?.totals
  const prevSummary = activePlatform==='all' ? prevData?.totals : prevData?.platforms.find(p=>p.platform===activePlatform)?.summary
  const daily = !data ? [] : activePlatform==='all' ? merge(data.platforms.map(p=>p.daily).flat()) : ap?.daily ?? []
  const days = Math.ceil((new Date(to).getTime()-new Date(from).getTime())/(1000*60*60*24))+1

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>


        <div style={{ maxWidth:'1200px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'20px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// АДМІН · ЗВІТИ</p>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Звіти</h1>
                {currentClient && <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>{currentClient.name} · {currentClient.company} · {days} днів</p>}
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={()=>setCompare(!compare)} style={tabStyle(compare)}>
                  {compare ? '✓ Порівняння' : 'Порівняння'}
                </button>
                <button onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:'6px', padding: isMobile ? '7px 10px' : '9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text2)', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                  <Download size={14}/>{!isMobile && 'Експорт CSV'}
                </button>
                {/* Client dropdown */}
                <div style={{ position:'relative', zIndex:200 }}>
                  <button ref={dropdownBtnRef} onClick={()=>{ if(dropdownBtnRef.current) setDropdownRect(dropdownBtnRef.current.getBoundingClientRect()); setShowDropdown(!showDropdown) }} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', fontWeight:600, cursor:'pointer', minWidth: isMobile ? '120px' : '180px', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <Users size={13} style={{color:'var(--text3)'}}/>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: isMobile ? '70px' : '130px' }}>{currentClient?.name ?? 'Клієнт'}</span>
                    </div>
                    <span style={{ fontSize:'10px', color:'var(--text3)' }}>▼</span>
                  </button>

                </div>
              </div>
            </div>
          </div>

          {/* Пресети + дати */}
          <div className="anim-up-1" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '14px' : '20px', marginBottom:'16px' }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
              {PRESETS.map(p=>(
                <button key={p.label} onClick={()=>applyPreset(p)} style={{ padding:'6px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:'1px solid', background:activePreset===p.label?'rgba(230,0,0,0.12)':'transparent', color:activePreset===p.label?'#ff4444':'var(--text3)', borderColor:activePreset===p.label?'rgba(230,0,0,0.3)':'var(--border)' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Calendar size={14} style={{color:'var(--text3)', flexShrink:0}}/>
                <span style={{ fontSize:'12px', color:'var(--text3)', width:'24px' }}>Від</span>
                <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setActivePreset('') }} max={to} style={{ ...inpStyle, colorScheme:'dark', flex:1 }}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Calendar size={14} style={{color:'var(--text3)', flexShrink:0}}/>
                <span style={{ fontSize:'12px', color:'var(--text3)', width:'24px' }}>До</span>
                <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setActivePreset('') }} min={from} max={today} style={{ ...inpStyle, colorScheme:'dark', flex:1 }}/>
              </div>
            </div>
          </div>

          {/* Platform tabs */}
          <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
            <button onClick={()=>setActivePlatform('all')} style={tabStyle(activePlatform==='all')}>Всі платформи</button>
            {Array.from(new Map(data?.platforms.map(p=>[p.platform,p])).values()).map(p=>(
              <button key={p.platform} onClick={()=>setActivePlatform(p.platform)} style={{ ...tabStyle(activePlatform===p.platform, PCOLOR[p.platform]), display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }}/>
                {isMobile ? (p.platform === 'FACEBOOK' ? 'Meta' : p.platform === 'GOOGLE' ? 'Google' : 'TikTok') : PLABEL[p.platform]}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:'16px' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)' }}>Завантаження звіту...</p>
            </div>
          ) : summary && (
            <>
              {/* KPI верхні 4 */}
              <div className="anim-up-2" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'10px', marginBottom:'10px' }}>
                {[
                  { label:'Витрати', value:formatCurrency(summary.totalSpend), curr:summary.totalSpend, prev:prevSummary?.totalSpend, color:'#e60000' },
                  { label:'Покази', value:formatNumber(summary.totalImpressions), curr:summary.totalImpressions, prev:prevSummary?.totalImpressions, color:'var(--text)' },
                  { label:'Кліки', value:formatNumber(summary.totalClicks), curr:summary.totalClicks, prev:prevSummary?.totalClicks, color:'var(--text)' },
                  { label:'Конверсії', value:formatNumber(summary.totalConversions), curr:summary.totalConversions, prev:prevSummary?.totalConversions, color:'#00c864' },
                ].map(card=>(
                  <div key={card.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '14px' : '18px 20px' }}>
                    <p style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', margin:'0 0 8px' }}>{card.label}</p>
                    <p style={{ fontSize: isMobile ? '18px' : '20px', fontWeight:800, color:card.color, margin:'0 0 6px', fontFamily:'monospace' }}>{card.value}</p>
                    {compare && card.prev !== undefined && <Trend curr={card.curr} prev={card.prev}/>}
                  </div>
                ))}
              </div>

              {/* KPI нижні 3 */}
              <div className="anim-up-2" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
                {[
                  { label:'CTR', value:formatPercent(summary.ctr), curr:summary.ctr, prev:prevSummary?.ctr, color:'var(--text)' },
                  { label:'CPC', value:formatCurrency(summary.cpc), curr:summary.cpc, prev:prevSummary?.cpc, color:'var(--text)' },
                  { label:'ROAS', value:`${summary.roas.toFixed(2)}×`, curr:summary.roas, prev:prevSummary?.roas, color:summary.roas>=2?'#00c864':summary.roas>=1?'#fbbf24':'#ff4444' },
                ].map(card=>(
                  <div key={card.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '14px' : '18px 20px', textAlign:'center' }}>
                    <p style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', margin:'0 0 6px' }}>{card.label}</p>
                    <p style={{ fontSize: isMobile ? '18px' : '22px', fontWeight:800, color:card.color, margin:'0 0 4px', fontFamily:'monospace' }}>{card.value}</p>
                    {compare && card.prev !== undefined && <Trend curr={card.curr} prev={card.prev}/>}
                  </div>
                ))}
              </div>

              {/* Щоденна таблиця */}
              <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Щоденна розбивка</p>
                  <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)', margin:0 }}>{daily.length} днів</p>
                </div>
                <div style={{ maxHeight:'280px', overflowY:'auto', overflowX:'auto', WebkitOverflowScrolling:'touch' } as any}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead style={{ position:'sticky', top:0, background:'var(--bg2)', zIndex:1 }}>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {(isMobile ? ['Дата','Витрати','Кліки'] : ['Дата','Витрати','Дохід','Покази','Кліки','Конверсії','CTR','CPC']).map(h=>(
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map(d=>(
                        <tr key={d.date} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', fontWeight:600, whiteSpace:'nowrap' }}>{new Date(d.date).toLocaleDateString('uk',{day:'2-digit',month:'short'})}</td>
                          <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'#e60000', fontWeight:700, whiteSpace:'nowrap' }}>{formatCurrency(d.spend)}</td>
                          {!isMobile && <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'#00c864', fontWeight:700, whiteSpace:'nowrap' }}>{formatCurrency(d.revenue)}</td>}
                          {!isMobile && <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatNumber(d.impressions)}</td>}
                          <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatNumber(d.clicks)}</td>
                          {!isMobile && <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', whiteSpace:'nowrap' }}>{formatNumber(d.conversions)}</td>}
                          {!isMobile && <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', whiteSpace:'nowrap' }}>{d.impressions>0?formatPercent((d.clicks/d.impressions)*100):'—'}</td>}
                          {!isMobile && <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', whiteSpace:'nowrap' }}>{d.clicks>0?formatCurrency(d.spend/d.clicks):'—'}</td>}
                        </tr>
                      ))}
                      {daily.length===0 && <tr><td colSpan={isMobile ? 3 : 8} style={{ padding:'40px', textAlign:'center', color:'var(--text4)', fontSize:'13px' }}>Немає даних за обраний період</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Графіки */}
              <div className="anim-up-4" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'16px' }}>
                <SpendChart data={daily} title="Витрати та дохід"/>
                <ClicksChart data={daily} title="Кліки та конверсії"/>
              </div>
            </>
          )}
        </div>
      </main>
      {showDropdown && dropdownRect && typeof document !== 'undefined' && createPortal(
        <>
          <div style={{ position:'fixed', inset:0, zIndex:99998 }} onClick={()=>setShowDropdown(false)}/>
          <div style={{
            position:'fixed',
            top: dropdownRect.bottom + 6,
            left: isMobile ? 16 : dropdownRect.left,
            right: isMobile ? 16 : 'auto',
            width: isMobile ? 'auto' : dropdownRect.width,
            minWidth:'180px',
            background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'10px',
            boxShadow:'0 16px 48px rgba(0,0,0,0.8)', zIndex:99999, overflow:'auto', maxHeight:'280px'
          }}>
            {clients.map((c,i)=>(
              <button key={c.id} onClick={()=>{ setSelectedClient(c.id); setShowDropdown(false) }}
                style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'10px 14px', background:selectedClient===c.id?'rgba(230,0,0,0.1)':'transparent', border:'none', borderBottom:i<clients.length-1?'1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', textAlign:'left' as const }}
              >
                <span style={{ fontSize:'13px', fontWeight:600, color:selectedClient===c.id?'#ff4444':'var(--text)' }}>{c.name}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
