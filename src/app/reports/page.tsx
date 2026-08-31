'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Calendar, Download, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }

const PRESETS = [
  { label:'Сьогодні', getValue: () => { const t=new Date().toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'Вчора', getValue: () => { const d=new Date(); d.setDate(d.getDate()-1); const t=d.toISOString().split('T')[0]; return {from:t,to:t} } },
  { label:'7 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-7); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'14 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-14); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'30 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-30); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'90 днів', getValue: () => { const d=new Date(); d.setDate(d.getDate()-90); return {from:d.toISOString().split('T')[0],to:new Date().toISOString().split('T')[0]} } },
  { label:'Цей місяць', getValue: () => { const d=new Date(); return {from:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,to:d.toISOString().split('T')[0]} } },
  { label:'Минулий місяць', getValue: () => { const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); const from=d.toISOString().split('T')[0]; const last=new Date(d.getFullYear(),d.getMonth()+1,0); return {from,to:last.toISOString().split('T')[0]} } },
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

const gridBg = { position:'fixed' as const, inset:0,  pointerEvents:'none' as const, zIndex:0 }
const inp = { padding:'10px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', cursor:'pointer', fontFamily:'monospace' }

export default function ReportsPage() {
  const { data: session } = useSession()
  const today = new Date().toISOString().split('T')[0]
  const d30 = new Date(); d30.setDate(d30.getDate()-30)

  const [from, setFrom] = useState(d30.toISOString().split('T')[0])
  const [to, setTo] = useState(today)
  const [activePreset, setActivePreset] = useState('30 днів')
  const [activePlatform, setActivePlatform] = useState<'all'|Platform>('all')
  const [data, setData] = useState<ClientDashboardData|null>(null)
  const [prevData, setPrevData] = useState<ClientDashboardData|null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [compare, setCompare] = useState(true)
  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const fetchData = async (f: string, t: string) => {
    setLoading(true)
    const res = await fetch(`/api/metrics?from=${f}&to=${t}`)
    const d = await res.json()
    setData(d)

    // Попередній період такої ж довжини
    if (compare) {
      const days = Math.ceil((new Date(t).getTime()-new Date(f).getTime())/(1000*60*60*24))
      const pf = new Date(f); pf.setDate(pf.getDate()-days-1)
      const pt = new Date(f); pt.setDate(pt.getDate()-1)
      const res2 = await fetch(`/api/metrics?from=${pf.toISOString().split('T')[0]}&to=${pt.toISOString().split('T')[0]}`)
      setPrevData(await res2.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { fetchData(from, to) }, [from, to, compare])

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const {from:f,to:t} = preset.getValue()
    setFrom(f); setTo(t); setActivePreset(preset.label)
  }

  const exportCSV = () => {
    if (!data) return
    const ap = activePlatform==='all' ? null : data.platforms.find(p=>p.platform===activePlatform)
    const daily = activePlatform==='all' ? merge((data?.platforms ?? []).map(p=>p.daily).flat()) : ap?.daily ?? []
    const rows = [
      ['Дата','Витрати','Покази','Кліки','Конверсії','Дохід'],
      ...daily.map(d=>[d.date, d.spend.toFixed(2), d.impressions, d.clicks, d.conversions, d.revenue.toFixed(2)])
    ]
    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url
    a.download = `ad-tracker-report-${from}-${to}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const tabStyle = (active: boolean, color?: string) => ({
    padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? (color?`${color}18`:'rgba(230,0,0,0.12)') : 'transparent',
    color: active ? (color??'#ff4444') : 'var(--text3)',
    borderColor: active ? (color?`${color}40`:'rgba(230,0,0,0.3)') : 'var(--border)',
  })

  const ap = activePlatform==='all' ? null : data?.platforms.find(p=>p.platform===activePlatform)
  const summary = ap ? ap.summary : data?.totals
  const prevSummary = activePlatform==='all' ? prevData?.totals : prevData?.platforms.find(p=>p.platform===activePlatform)?.summary
  const daily = !data ? [] : activePlatform==='all' ? merge((data?.platforms ?? []).map(p=>p.daily).flat()) : ap?.daily ?? []

  const days = Math.ceil((new Date(to).getTime()-new Date(from).getTime())/(1000*60*60*24))+1

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>
        <div style={{ position:'fixed', top:'-60px', right:'10%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(230,0,0,0.05) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

        <div style={{ maxWidth:'1200px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// ЗВІТИ</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'var(--text)', margin:0 }}>Звіти та аналітика</h1>
              <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>
                {data?.client?.company} · {days} {days===1?'день':days<5?'дні':'днів'} · {from} → {to}
              </p>
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <button onClick={()=>setCompare(!compare)} style={{ ...tabStyle(compare), fontSize:'12px' }}>
                {compare ? '✓ Порівняння' : 'Порівняння'}
              </button>
              <button onClick={async()=>{
                if(!data) return
                const {generateReportPDF} = await import('@/lib/generatePDF')
                await generateReportPDF({
                  clientName: data.client?.name ?? 'Клієнт',
                  company: data.client?.company ?? '',
                  dateRange: `${from} → ${to}`,
                  totals: data.totals,
                  platforms: data.platforms,
                })
              }} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff4444', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(230,0,0,0.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(230,0,0,0.08)'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF звіт
              </button>
              <button onClick={()=>setEmailModal(true)} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text2)', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                На email
              </button>
              <button onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:'8px', color:'var(--text2)', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(230,0,0,0.3)'; e.currentTarget.style.color='#ff4444' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.6)' }}
              >
                <Download size={14}/>Експорт CSV
              </button>
            </div>
          </div>

          {/* Пресети + дати */}
          <div className="anim-up-1" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
              {PRESETS.map(p=>(
                <button key={p.label} onClick={()=>applyPreset(p)} style={{ padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s', background: activePreset===p.label ? 'rgba(230,0,0,0.12)' : 'transparent', color: activePreset===p.label ? '#ff4444' : 'var(--text3)', borderColor: activePreset===p.label ? 'rgba(230,0,0,0.3)' : 'var(--border)' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Calendar size={14} style={{color:'var(--text3)'}}/>
                <span style={{ fontSize:'12px', color:'var(--text3)' }}>Від</span>
                <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setActivePreset('') }} max={to}
                  style={{ ...inp, colorScheme:'dark' }}
                  onFocus={e=>{ e.target.style.borderColor='#e60000' }}
                  onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.08)' }}
                />
              </div>
              <span style={{ fontSize:'12px', color:'var(--text4)' }}>→</span>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'12px', color:'var(--text3)' }}>До</span>
                <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setActivePreset('') }} min={from} max={today}
                  style={{ ...inp, colorScheme:'dark' }}
                  onFocus={e=>{ e.target.style.borderColor='#e60000' }}
                  onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.08)' }}
                />
              </div>
              {compare && prevData && (
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)', marginLeft:'8px' }}>
                  vs попередній період
                </span>
              )}
            </div>
          </div>

          {/* Platform tabs */}
          <div className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
            <button onClick={()=>setActivePlatform('all')} style={tabStyle(activePlatform==='all')}>Всі платформи</button>
            {Array.from(new Map((data?.platforms ?? []).map(p=>[p.platform,p])).values()).map(p=>(
              <button key={p.platform} onClick={()=>setActivePlatform(p.platform)} style={{ ...tabStyle(activePlatform===p.platform, PCOLOR[p.platform]), display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:PCOLOR[p.platform], display:'inline-block' }}/>
                {PLABEL[p.platform]}
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
              {/* KPI картки з трендом */}
              <div className="anim-up-2" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'12px', marginBottom:'12px' }}>
                {[
                  { label:'Витрати', value:formatCurrency(summary.totalSpend), prev:prevSummary?.totalSpend, color:'#e60000' },
                  { label:'Покази', value:formatNumber(summary.totalImpressions), prev:prevSummary?.totalImpressions, color:'var(--text)' },
                  { label:'Кліки', value:formatNumber(summary.totalClicks), prev:prevSummary?.totalClicks, color:'var(--text)' },
                  { label:'Конверсії', value:formatNumber(summary.totalConversions), prev:prevSummary?.totalConversions, color:'#00c864' },
                ].map(card=>(
                  <div key={card.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(230,0,0,0.15)' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.06)' }}
                  >
                    <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', margin:'0 0 10px' }}>{card.label}</p>
                    <p style={{ fontSize:'20px', fontWeight:800, color:card.color, margin:'0 0 8px', fontFamily:'monospace' }}>{card.value}</p>
                    {compare && card.prev !== undefined && <Trend curr={typeof summary.totalSpend==='number' ? (card.label==='Витрати'?summary.totalSpend:card.label==='Покази'?summary.totalImpressions:card.label==='Кліки'?summary.totalClicks:summary.totalConversions) : 0} prev={card.prev}/>}
                  </div>
                ))}
              </div>

              <div className="anim-up-2" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
                {[
                  { label:'CTR', value:formatPercent(summary.ctr), prev:prevSummary?.ctr, color:'var(--text)', curr:summary.ctr },
                  { label:'CPC', value:formatCurrency(summary.cpc), prev:prevSummary?.cpc, color:'var(--text)', curr:summary.cpc },
                  { label:'ROAS', value:`${summary.roas.toFixed(2)}×`, prev:prevSummary?.roas, color: summary.roas>=2?'#00c864':summary.roas>=1?'#fbbf24':'#ff4444', curr:summary.roas },
                ].map(card=>(
                  <div key={card.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px', textAlign:'center' as const }}>
                    <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', margin:'0 0 8px' }}>{card.label}</p>
                    <p style={{ fontSize:'22px', fontWeight:800, color:card.color, margin:'0 0 6px', fontFamily:'monospace' }}>{card.value}</p>
                    {compare && card.prev !== undefined && <Trend curr={card.curr} prev={card.prev}/>}
                  </div>
                ))}
              </div>

              {/* Таблиця по платформах */}
              {activePlatform==='all' && data && data.platforms.length > 0 && (
                <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Розбивка по платформах</p>
                    <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)', margin:0 }}>{from} → {to}</p>
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {['Платформа','Витрати','Дохід','Покази','Кліки','CTR','CPC','ROAS'].map(h=>(
                          <th key={h} style={{ padding:'11px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'var(--text4)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.platforms ?? []).map(p=>{
                        const c=PCOLOR[p.platform]
                        const pp = prevData?.platforms.find(x=>x.platform===p.platform)
                        return (
                          <tr key={p.platform} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer', transition:'background 0.15s' }}
                            onClick={()=>setActivePlatform(p.platform)}
                            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                            onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                          >
                            <td style={{ padding:'14px 16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:c, flexShrink:0, display:'inline-block' }}/>
                                <div>
                                  <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', margin:0 }}>{PLABEL[p.platform]}</p>
                                  <p style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text4)', margin:'2px 0 0' }}>{p.accountId}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:'14px 16px' }}>
                              <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#e60000', fontWeight:700, margin:0 }}>{formatCurrency(p.summary.totalSpend)}</p>
                              {compare && pp && <Trend curr={p.summary.totalSpend} prev={pp.summary.totalSpend}/>}
                            </td>
                            <td style={{ padding:'14px 16px' }}>
                              <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#00c864', fontWeight:700, margin:0 }}>{formatCurrency(p.summary.totalRevenue)}</p>
                            </td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)' }}>{formatNumber(p.summary.totalImpressions)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)' }}>{formatNumber(p.summary.totalClicks)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)' }}>{formatPercent(p.summary.ctr)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', color:'var(--text2)' }}>{formatCurrency(p.summary.cpc)}</td>
                            <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'13px', fontWeight:700, color: p.summary.roas>=2?'#00c864':p.summary.roas>=1?'#fbbf24':'#ff4444' }}>{p.summary.roas.toFixed(2)}×</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Щоденна таблиця */}
              <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Щоденна розбивка</p>
                  <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)', margin:0 }}>{daily.length} днів</p>
                </div>
                <div style={{ maxHeight:'320px', overflowY:'auto' }}>
                  <table className="daily-table" style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead style={{ position:'sticky', top:0, background:'var(--bg2)', zIndex:1 }}>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        {['Дата','Витрати','Дохід','Покази','Кліки','Конверсії','CTR','CPC'].map(h=>(
                          <th key={h} style={{ padding:'11px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'var(--text4)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map((d,i)=>(
                        <tr key={d.date} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                          onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                        >
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)', fontWeight:600 }}>
                            {new Date(d.date).toLocaleDateString('uk',{day:'2-digit',month:'short',year:'numeric'})}
                          </td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'#e60000', fontWeight:700 }}>{formatCurrency(d.spend)}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'#00c864', fontWeight:700 }}>{formatCurrency(d.revenue)}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)' }}>{formatNumber(d.impressions)}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)' }}>{formatNumber(d.clicks)}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)' }}>{formatNumber(d.conversions)}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)' }}>{d.impressions>0?formatPercent((d.clicks/d.impressions)*100):'—'}</td>
                          <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text2)' }}>{d.clicks>0?formatCurrency(d.spend/d.clicks):'—'}</td>
                        </tr>
                      ))}
                      {daily.length===0 && (
                        <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'var(--text4)', fontSize:'13px' }}>Немає даних за обраний період</td></tr>
                      )}
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

      {/* Email модалка */}
      {emailModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>{ if(e.target===e.currentTarget){ setEmailModal(false); setEmailSent(false); setEmailTo('') } }}
        >
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'16px', padding:'32px', width:'400px', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
            {emailSent ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(0,200,100,0.12)', border:'1px solid rgba(0,200,100,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c864" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize:'18px', fontWeight:800, color:'var(--text)', margin:'0 0 8px' }}>Звіт відправлено!</h3>
                <p style={{ fontSize:'13px', color:'var(--text3)', margin:'0 0 24px' }}>Звіт надіслано на {emailTo}</p>
                <button onClick={()=>{ setEmailModal(false); setEmailSent(false); setEmailTo('') }}
                  style={{ padding:'10px 24px', background:'#e60000', color:'#fff', borderRadius:'8px', border:'none', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                  Закрити
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(230,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e60000" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize:'16px', fontWeight:800, color:'var(--text)', margin:0 }}>Відправити звіт</h3>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Звіт буде надіслано на вказаний email</p>
                  </div>
                </div>
                <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px' }}>
                  <p style={{ fontSize:'11px', fontWeight:600, color:'var(--text3)', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Звіт включає</p>
                  <p style={{ fontSize:'13px', color:'var(--text)', margin:0 }}>{data?.client?.name} · {from} → {to}</p>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'8px' }}>Email отримувача</label>
                  <input type="email" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="client@example.com" autoFocus
                    style={{ width:'100%', padding:'11px 14px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', boxSizing:'border-box' as const }}
                    onFocus={e=>{ e.target.style.borderColor='#e60000'; e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)' }}
                    onBlur={e=>{ e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none' }}
                  />
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={()=>{ setEmailModal(false); setEmailTo('') }}
                    style={{ flex:1, padding:'11px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text3)', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    Скасувати
                  </button>
                  <button disabled={emailSending || !emailTo}
                    onClick={async()=>{
                      if(!emailTo || !data) return
                      setEmailSending(true)
                      const res = await fetch('/api/send-report', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ to:emailTo, clientName:data.client?.name??'Клієнт', company:data.client?.company??'', dateRange:`${from} → ${to}`, totals:data.totals, platforms:data.platforms }) })
                      setEmailSending(false)
                      if(res.ok) setEmailSent(true)
                    }}
                    style={{ flex:2, padding:'11px', background: emailSending||!emailTo?'#555':'#e60000', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor: emailSending||!emailTo?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    {emailSending
                      ? <><div style={{ width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Відправляємо...</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Відправити звіт</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
