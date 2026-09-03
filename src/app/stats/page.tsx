'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { ClientDashboardData, Platform } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { ChevronDown, Check, Calendar, X } from 'lucide-react'

const PLABEL: Record<Platform,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }
const PCOLOR: Record<Platform,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }
const PERIODS = [
  { label:'7 д', days:7 },
  { label:'14 д', days:14 },
  { label:'30 д', days:30 },
  { label:'90 д', days:90 },
]

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }
function getFrom(days: number) { const d = new Date(); d.setDate(d.getDate() - days); return toDateStr(d) }
function today() { return toDateStr(new Date()) }

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

const gridBg = { position:'fixed' as const, inset:0, pointerEvents:'none' as const, zIndex:0 }

export default function StatsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')
  const [exchangeRate, setExchangeRate] = useState(1)
  const [conversionValue, setConversionValue] = useState<number | null>(null)

  const [period, setPeriod] = useState<number | null>(30)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, right: 0 })
  const [tempFrom, setTempFrom] = useState('')
  const [tempTo, setTempTo] = useState('')
  const datePickerRef = useRef<HTMLDivElement>(null)

  const [activePlatform, setActivePlatform] = useState<'all'|Platform>('all')
  const [activeAccount, setActiveAccount] = useState<string>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareAccount, setCompareAccount] = useState<string>('')
  const [dropdown, setDropdown] = useState<Platform|null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const dateFrom = period !== null ? getFrom(period) : customFrom
  const dateTo = period !== null ? today() : customTo
  const isCustom = period === null && !!customFrom && !!customTo

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/profile').then(r=>r.json()).then(async d => {
      const cur = d.client?.currency ?? 'USD'
      setCurrency(cur)
      const cv = d.client?.conversionValue ?? null
      setConversionValue(cv && cv > 0 ? cv : null)
      if (cur !== 'USD') {
        try {
          const rr = await fetch('/api/currency?to=' + cur)
          const rd = await rr.json()
          setExchangeRate(rd.rate ?? 1)
        } catch {}
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    fetch(`/api/metrics?from=${dateFrom}&to=${dateTo}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
  }, [dateFrom, dateTo])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdown(null)
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setShowDatePicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const applyCustomDates = () => {
    if (!tempFrom || !tempTo || tempFrom > tempTo) return
    setCustomFrom(tempFrom); setCustomTo(tempTo); setPeriod(null); setShowDatePicker(false)
  }
  const resetToPreset = (days: number) => { setPeriod(days); setCustomFrom(''); setCustomTo('') }
  const calcRevenue = (conversions: number, apiRevenue: number) =>
    conversionValue ? conversions * conversionValue : apiRevenue

  const platformAccounts = (pl: Platform) => data?.platforms.filter(p=>p.platform===pl) ?? []
  const selectedAccountName = activeAccount === 'all' ? null : data?.platforms.find(p=>p.accountId===activeAccount)?.accountName

  const filteredPlatforms = !data ? [] : activePlatform === 'all'
    ? data.platforms : data.platforms.filter(p => p.platform === activePlatform)
  const displayPlatforms = activeAccount === 'all'
    ? filteredPlatforms : filteredPlatforms.filter(p => p.accountId === activeAccount)

  const summary = displayPlatforms.length === 0 ? null : (() => {
    const s: any = {
      totalSpend: displayPlatforms.reduce((s,p)=>s+p.summary.totalSpend,0),
      totalImpressions: displayPlatforms.reduce((s,p)=>s+p.summary.totalImpressions,0),
      totalClicks: displayPlatforms.reduce((s,p)=>s+p.summary.totalClicks,0),
      totalConversions: displayPlatforms.reduce((s,p)=>s+p.summary.totalConversions,0),
      totalRevenue: displayPlatforms.reduce((s,p)=>s+p.summary.totalRevenue,0),
    }
    s.effectiveRevenue = calcRevenue(s.totalConversions, s.totalRevenue)
    s.ctr = s.totalImpressions > 0 ? (s.totalClicks/s.totalImpressions)*100 : 0
    s.cpc = s.totalClicks > 0 ? s.totalSpend/s.totalClicks : 0
    s.roas = s.totalSpend > 0 ? s.effectiveRevenue/s.totalSpend : 0
    s.costPerConversion = s.totalConversions > 0 ? s.totalSpend/s.totalConversions : 0
    return s
  })()

  const daily = merge(displayPlatforms.map(p=>p.daily).flat()).map(d => ({
    ...d, revenue: calcRevenue(d.conversions, d.revenue)
  }))

  const uniquePlatforms = data ? Array.from(new Set(data.platforms.map(p=>p.platform))) as Platform[] : []

  const tabStyle = (active: boolean, color?: string) => ({
    padding:'7px 13px', borderRadius:'7px', fontSize:'12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? (color ? `${color}18` : 'rgba(230,0,0,0.12)') : 'transparent',
    color: active ? (color ?? '#ff4444') : 'var(--text3)',
    borderColor: active ? (color ? `${color}40` : 'rgba(230,0,0,0.3)') : 'var(--border)',
  })

  const labelDate = (s: string) => s ? new Date(s + 'T00:00:00').toLocaleDateString('uk', { day:'numeric', month:'short' }) : ''

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom: isMobile ? '16px' : '28px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// ДЕТАЛЬНА СТАТИСТИКА</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'var(--text)', margin:0 }}>Статистика</h1>
              <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>
                {(session?.user as any)?.name} · {data?.client?.company}
                {selectedAccountName && <span style={{ color:'var(--text2)', fontWeight:600 }}> · {selectedAccountName}</span>}
              </p>
            </div>

            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' as const }}>
              {PERIODS.map(p=>(
                <button key={p.days} onClick={()=>resetToPreset(p.days)} style={tabStyle(period===p.days)}>{p.label}</button>
              ))}

              <div ref={datePickerRef} style={{ position:'relative' }}>
                <button
                  onClick={(e)=>{
                    setTempFrom(customFrom||getFrom(30)); setTempTo(customTo||today())
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    setPickerPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
                    setShowDatePicker(!showDatePicker)
                  }}
                  style={{ ...tabStyle(isCustom), display:'flex', alignItems:'center', gap:'6px' }}
                >
                  <Calendar size={12}/>
                  {isCustom ? `${labelDate(customFrom)} — ${labelDate(customTo)}` : 'Діапазон'}
                  {isCustom && (
                    <span onClick={e=>{ e.stopPropagation(); resetToPreset(30) }} style={{ display:'inline-flex', alignItems:'center' }}>
                      <X size={11}/>
                    </span>
                  )}
                </button>

                {showDatePicker && (
                  <div style={{
                    position: 'fixed',
                    top: isMobile ? 'auto' : pickerPos.top,
                    bottom: isMobile ? 70 : 'auto',
                    right: isMobile ? 16 : pickerPos.right, left: isMobile ? 16 : 'auto',
                    background:'var(--bg4)', border:'1px solid var(--border2)',
                    borderRadius:'12px', boxShadow:'0 24px 64px rgba(0,0,0,0.8)',
                    zIndex:9999, padding:'16px', minWidth:'260px'
                  }}>
                    <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.1em', color:'var(--text3)', marginBottom:'12px' }}>// ДІАПАЗОН ДАТ</p>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:'10px', marginBottom:'12px' }}>
                      {([{label:'З', val:tempFrom, set:setTempFrom, max:tempTo||today(), min:''}, {label:'ПО', val:tempTo, set:setTempTo, max:today(), min:tempFrom}] as any[]).map((f:any)=>(
                        <div key={f.label}>
                          <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'var(--text3)', marginBottom:'5px' }}>{f.label}</label>
                          <input type="date" value={f.val} min={f.min||undefined} max={f.max} onChange={e=>f.set(e.target.value)}
                            style={{ width:'100%', padding:'9px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, colorScheme:'dark' as any }}/>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' as const, marginBottom:'12px' }}>
                      {[
                        { label:'Цей міс.', from:toDateStr(new Date(new Date().getFullYear(),new Date().getMonth(),1)), to:today() },
                        { label:'Мин. міс.', from:toDateStr(new Date(new Date().getFullYear(),new Date().getMonth()-1,1)), to:toDateStr(new Date(new Date().getFullYear(),new Date().getMonth(),0)) },
                        { label:'Цей рік', from:toDateStr(new Date(new Date().getFullYear(),0,1)), to:today() },
                      ].map(q=>(
                        <button key={q.label} onClick={()=>{ setTempFrom(q.from); setTempTo(q.to) }}
                          style={{ padding:'5px 9px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text3)', fontSize:'11px', cursor:'pointer', fontWeight:500 }}>
                          {q.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={()=>setShowDatePicker(false)}
                        style={{ flex:1, padding:'9px', background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text3)', fontSize:'13px', cursor:'pointer', fontWeight:600 }}>
                        Скасувати
                      </button>
                      <button onClick={applyCustomDates} disabled={!tempFrom||!tempTo||tempFrom>tempTo}
                        style={{ flex:1, padding:'9px', background:(!tempFrom||!tempTo||tempFrom>tempTo)?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', cursor:(!tempFrom||!tempTo||tempFrom>tempTo)?'not-allowed':'pointer', fontWeight:700 }}>
                        Застосувати
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={()=>{ setCompareMode(!compareMode); setCompareAccount('') }}
                style={{ ...tabStyle(compareMode), display:'flex', alignItems:'center', gap:'6px' }}>
                ⇄ Порівняти
              </button>
            </div>
          </div>

          <div style={{ marginBottom:'20px' }}>
            <svg width="100%" height="16" viewBox="0 0 1000 16" preserveAspectRatio="none">
              <path d="M0,8 C50,2 100,14 150,8 C200,2 250,14 300,8 C350,2 400,14 450,8 C500,2 550,14 600,8 C650,2 700,14 750,8 C800,2 850,14 900,8 C950,2 1000,14 1050,8" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {conversionValue && conversionValue > 0 && (
            <div style={{ background:'rgba(0,200,100,0.06)', border:'1px solid rgba(0,200,100,0.2)', borderRadius:'10px', padding:'10px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'15px' }}>💰</span>
              <p style={{ margin:0, fontSize:'12px', color:'var(--text3)' }}>
                Дохід = Конверсії × <span style={{ color:'#00c864', fontWeight:700, fontFamily:'monospace' }}>{formatCurrency(conversionValue * exchangeRate, currency)}/конверсія</span> · ROAS показує реальну окупність
              </p>
            </div>
          )}

          <div ref={dropdownRef} className="anim-up-1" style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' as const, position:'relative', zIndex:50 }}>
            <button onClick={()=>{ setActivePlatform('all'); setActiveAccount('all'); setDropdown(null) }} style={tabStyle(activePlatform==='all')}>
              Всі платформи
            </button>
            {uniquePlatforms.map(pl=>{
              const accounts = platformAccounts(pl)
              const isActive = activePlatform === pl
              const color = PCOLOR[pl]
              const hasMultiple = accounts.length > 1
              const currentAcc = isActive && activeAccount !== 'all' ? accounts.find(a=>a.accountId===activeAccount) : null
              return (
                <div key={pl} style={{ position:'relative' }}>
                  <button
                    onClick={()=>{ if(hasMultiple){setDropdown(dropdown===pl?null:pl);setActivePlatform(pl)}else{setActivePlatform(pl);setActiveAccount('all');setDropdown(null)} }}
                    style={{ ...tabStyle(isActive,color), display:'flex', alignItems:'center', gap:'7px' }}
                  >
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:color }}/>
                    {PLABEL[pl]}
                    {currentAcc && <span style={{ fontFamily:'monospace', fontSize:'10px', opacity:0.7 }}>· {currentAcc.accountName}</span>}
                    {hasMultiple && <ChevronDown size={12} style={{ opacity:0.6, transform:dropdown===pl?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>}
                  </button>
                  {dropdown===pl && hasMultiple && (
                    <div style={{ position:isMobile?'fixed':'absolute', top:isMobile?'auto':0, bottom:isMobile?60:'auto', left:isMobile?16:'calc(100% + 8px)', right:isMobile?16:'auto', minWidth:'240px', background:'var(--bg4)', border:'1px solid var(--border2)', borderRadius:'10px', boxShadow:'0 16px 48px rgba(0,0,0,0.6)', zIndex:100, overflow:'hidden' }}>
                      <button onClick={()=>{setActiveAccount('all');setDropdown(null)}}
                        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left' as const }}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--bg3)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                        <div><p style={{fontSize:'13px',fontWeight:600,color:'var(--text)',margin:0}}>Всі кабінети</p><p style={{fontSize:'11px',color:'var(--text3)',margin:'2px 0 0',fontFamily:'monospace'}}>{accounts.length} кабінети</p></div>
                        {activeAccount==='all'&&<Check size={14} style={{color}}/>}
                      </button>
                      {accounts.map(acc=>(
                        <button key={acc.accountId} onClick={()=>{setActiveAccount(acc.accountId);setDropdown(null)}}
                          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', textAlign:'left' as const }}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--bg3)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                          <div><p style={{fontSize:'13px',fontWeight:600,color:activeAccount===acc.accountId?color:'var(--text)',margin:0}}>{acc.accountName}</p><p style={{fontSize:'11px',color:'var(--text3)',margin:'2px 0 0',fontFamily:'monospace'}}>{acc.accountId}</p></div>
                          {activeAccount===acc.accountId&&<Check size={14} style={{color}}/>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {compareMode && data && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:isMobile?'12px':'16px 20px', marginBottom:'16px', overflowX:'auto' }}>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', marginBottom:'12px' }}>// ПОРІВНЯННЯ КАБІНЕТІВ</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'var(--text3)', marginBottom:'6px' }}>Кабінет A</label>
                  <select value={activeAccount} onChange={e=>setActiveAccount(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none' }}>
                    <option value="all">Всі кабінети</option>
                    {data.platforms.map(p=><option key={p.accountId} value={p.accountId}>{p.accountName} ({p.platform})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'var(--text3)', marginBottom:'6px' }}>Кабінет B</label>
                  <select value={compareAccount} onChange={e=>setCompareAccount(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none' }}>
                    <option value="">Оберіть кабінет</option>
                    {data.platforms.filter(p=>p.accountId!==activeAccount).map(p=><option key={p.accountId} value={p.accountId}>{p.accountName} ({p.platform})</option>)}
                  </select>
                </div>
              </div>
              {compareAccount && (() => {
                const accA = activeAccount==='all'?null:data.platforms.find(p=>p.accountId===activeAccount)
                const accB = data.platforms.find(p=>p.accountId===compareAccount)
                const sA: any = accA?.summary??data.totals; const sB: any = accB?.summary
                if (!sB) return null
                const revA = calcRevenue(sA.totalConversions??0,sA.totalRevenue??0)
                const revB = calcRevenue(sB.totalConversions??0,sB.totalRevenue??0)
                const rows = [
                  {label:'Витрати',vA:sA.totalSpend,vB:sB.totalSpend,fmt:(v:number)=>formatCurrency(v*exchangeRate,currency),better:'lower'},
                  {label:'Дохід',vA:revA,vB:revB,fmt:(v:number)=>formatCurrency(v*exchangeRate,currency),better:'higher'},
                  {label:'Покази',vA:sA.totalImpressions,vB:sB.totalImpressions,fmt:formatNumber,better:'higher'},
                  {label:'Кліки',vA:sA.totalClicks,vB:sB.totalClicks,fmt:formatNumber,better:'higher'},
                  {label:'CTR',vA:sA.ctr,vB:sB.ctr,fmt:formatPercent,better:'higher'},
                  {label:'CPC',vA:sA.cpc,vB:sB.cpc,fmt:(v:number)=>formatCurrency(v*exchangeRate,currency),better:'lower'},
                  {label:'ROAS',vA:sA.totalSpend>0?revA/sA.totalSpend:0,vB:sB.totalSpend>0?revB/sB.totalSpend:0,fmt:(v:number)=>`${v.toFixed(2)}×`,better:'higher'},
                  {label:'Конверсії',vA:sA.totalConversions,vB:sB.totalConversions,fmt:formatNumber,better:'higher'},
                ]
                return (
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                      {['Метрика',accA?.accountName??'Всі',accB?.accountName??'','Різниця'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left' as const,fontSize:'10px',fontWeight:700,color:'var(--text4)',textTransform:'uppercase' as const,letterSpacing:'0.08em'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{rows.map(row=>{
                      const vA=row.vA??0;const vB=row.vB??0
                      const diff=vA>0?((vB-vA)/vA*100):0
                      const aWins=row.better==='higher'?vA>vB:vA<vB;const bWins=row.better==='higher'?vB>vA:vB<vA
                      return <tr key={row.label} style={{borderBottom:'1px solid var(--border)'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--bg3)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                        <td style={{padding:'12px 14px',fontSize:'13px',color:'var(--text)',fontWeight:600}}>{row.label}</td>
                        <td style={{padding:'12px 14px',textAlign:'center' as const,fontFamily:'monospace',fontSize:'13px',fontWeight:700,color:aWins?'#00c864':'var(--text)'}}>{aWins&&'✓ '}{row.fmt(vA)}</td>
                        <td style={{padding:'12px 14px',textAlign:'center' as const,fontFamily:'monospace',fontSize:'13px',fontWeight:700,color:bWins?'#00c864':'var(--text)'}}>{bWins&&'✓ '}{row.fmt(vB)}</td>
                        <td style={{padding:'12px 14px',textAlign:'center' as const,fontFamily:'monospace',fontSize:'12px',color:diff>0?'#00c864':diff<0?'#ff4444':'var(--text3)'}}>{diff>0?'+':''}{diff.toFixed(1)}%</td>
                      </tr>
                    })}</tbody>
                  </table>
                )
              })()}
            </div>
          )}

          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 0',flexDirection:'column' as const,gap:'16px'}}>
              <div style={{width:'32px',height:'32px',border:'2px solid rgba(230,0,0,0.2)',borderTopColor:'#e60000',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              <p style={{fontFamily:'monospace',fontSize:'11px',color:'var(--text3)'}}>Завантаження статистики...</p>
            </div>
          ) : summary && (
            <>
              <div className="anim-up-2" style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',marginBottom:'16px'}}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <p style={{fontSize:'12px',fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.08em',margin:0}}>
                    Зведені метрики{selectedAccountName&&<span style={{color:'var(--text3)',fontWeight:400}}> · {selectedAccountName}</span>}
                  </p>
                  <p style={{fontFamily:'monospace',fontSize:'11px',color:'var(--text3)',margin:0}}>{dateFrom} → {dateTo}</p>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    {(isMobile?['Метрика','Значення']:['Метрика','Значення','Деталі']).map(h=>(
                      <th key={h} style={{padding:'12px 20px',textAlign:'left' as const,fontSize:'10px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase' as const,letterSpacing:'0.08em',fontFamily:'monospace'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      {metric:'Витрати',value:formatCurrency(summary.totalSpend*exchangeRate,currency),detail:`Дохід: ${formatCurrency(summary.effectiveRevenue*exchangeRate,currency)}`,color:'#e60000'},
                      {metric:'Покази',value:formatNumber(summary.totalImpressions),detail:'Унікальні покази оголошень',color:'var(--text2)'},
                      {metric:'Кліки',value:formatNumber(summary.totalClicks),detail:`CTR: ${formatPercent(summary.ctr)}`,color:'var(--text2)'},
                      {metric:'Конверсії',value:formatNumber(summary.totalConversions),detail:`Ціна: ${formatCurrency(summary.costPerConversion*exchangeRate,currency)}${conversionValue?` · $${conversionValue}/конв.`:''}`,color:'#00c864'},
                      {metric:'CPC',value:formatCurrency(summary.cpc*exchangeRate,currency),detail:'Середня вартість кліку',color:'var(--text2)'},
                      {metric:'ROAS',value:`${summary.roas.toFixed(2)}×`,detail:`$1 → $${summary.roas.toFixed(2)} доходу${conversionValue?' (кастомна)':''} `,color:summary.roas>=2?'#00c864':summary.roas>=1?'#fbbf24':'#ff4444'},
                    ].map(row=>(
                      <tr key={row.metric} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background 0.15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                        <td style={{padding:'14px 20px',fontSize:'13px',color:'var(--text2)',fontWeight:500}}>{row.metric}</td>
                        <td style={{padding:'14px 20px',fontSize:'15px',fontWeight:800,color:row.color,fontFamily:'monospace'}}>{row.value}</td>
                        {!isMobile&&<td style={{padding:'14px 20px',fontSize:'13px',fontWeight:500,color:'var(--text3)',fontFamily:'monospace'}}>{row.detail}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activePlatform==='all' && data && data.platforms.length>1 && (
                <div className="anim-up-3" style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',marginBottom:'16px'}}>
                  <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)'}}><p style={{fontSize:'12px',fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.08em',margin:0}}>Розбивка по платформах</p></div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',minWidth:'540px'}}>
                      <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        {['Платформа / Кабінет','Витрати','Покази','Кліки','CTR','CPC','ROAS','Конв.'].map(h=>(
                          <th key={h} style={{padding:'12px 16px',textAlign:'left' as const,fontSize:'10px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase' as const,letterSpacing:'0.08em',fontFamily:'monospace'}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {data.platforms.map(p=>{
                          const c=PCOLOR[p.platform]
                          const pRevenue=calcRevenue(p.summary.totalConversions,p.summary.totalRevenue)
                          const pRoas=p.summary.totalSpend>0?pRevenue/p.summary.totalSpend:0
                          return (
                            <tr key={`${p.platform}-${p.accountId}`} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer'}}
                              onClick={()=>{setActivePlatform(p.platform);setActiveAccount(p.accountId);setDropdown(null)}}
                              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                              <td style={{padding:'14px 16px'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:c,flexShrink:0}}/>
                                <div><p style={{fontSize:'13px',fontWeight:600,color:'var(--text)',margin:0}}>{p.accountName}</p><p style={{fontFamily:'monospace',fontSize:'10px',color:'var(--text3)',margin:'2px 0 0'}}>{PLABEL[p.platform]}</p></div>
                              </div></td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'#e60000',fontWeight:700}}>{formatCurrency(p.summary.totalSpend*exchangeRate,currency)}</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'var(--text2)'}}>{formatNumber(p.summary.totalImpressions)}</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'var(--text2)'}}>{formatNumber(p.summary.totalClicks)}</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'var(--text2)'}}>{formatPercent(p.summary.ctr)}</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'var(--text2)'}}>{formatCurrency(p.summary.cpc*exchangeRate,currency)}</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',fontWeight:700,color:pRoas>=2?'#00c864':pRoas>=1?'#fbbf24':'#ff4444'}}>{pRoas.toFixed(2)}×</td>
                              <td style={{padding:'14px 16px',fontFamily:'monospace',fontSize:'13px',color:'var(--text2)'}}>{formatNumber(p.summary.totalConversions)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="anim-up-4" style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'16px'}}>
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
