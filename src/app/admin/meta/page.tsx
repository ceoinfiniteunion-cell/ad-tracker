'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { RefreshCw, CheckCircle, AlertCircle, Target, Zap } from 'lucide-react'

interface MetaAccount { id:string; name:string; account_id:string; account_status:number; currency:string }
interface DbClient { id:string; name:string; company:string; adAccounts:{ id:string; name:string; accountId:string; platform:string }[] }
interface Insights { spend?:string; impressions?:string; clicks?:string; ctr?:string; cpc?:string; cpp?:string; reach?:string; frequency?:string; actions?:any[]; action_values?:any[]; cost_per_action_type?:any[] }
interface Campaign { id:string; name:string; status:string; objective:string; insights?:Insights }
interface AdSet { id:string; name:string; status:string; campaign_id:string; optimization_goal?:string; insights?:Insights }

const STATUS_LABEL: Record<number,string> = { 1:'Активний', 2:'Вимкнений', 3:'Видалений', 7:'Архів' }

const OBJECTIVE_LABEL: Record<string,string> = {
  OUTCOME_LEADS: '🎯 Ліди',
  OUTCOME_SALES: '🛒 Продажі',
  OUTCOME_TRAFFIC: '🌐 Трафік',
  OUTCOME_ENGAGEMENT: '❤️ Залученість',
  OUTCOME_AWARENESS: '📢 Впізнаваність',
  OUTCOME_APP_PROMOTION: '📱 Додаток',
  LEAD_GENERATION: '📋 Форма лідів',
  CONVERSIONS: '🔄 Конверсії',
  LINK_CLICKS: '🖱️ Кліки',
  REACH: '👁️ Охоплення',
  BRAND_AWARENESS: '🏷️ Бренд',
  VIDEO_VIEWS: '▶️ Відео',
  MESSAGES: '💬 Повідомлення',
  PAGE_LIKES: '👍 Підписники',
  EVENT_RESPONSES: '📅 Події',
  STORE_VISITS: '🏪 Візити',
  CATALOG_SALES: '📦 Каталог',
  APP_INSTALLS: '📲 Встановлення',
}

const OPT_LABEL: Record<string,string> = {
  LEAD_GENERATION: '📋 Форма лідів',
  OFFSITE_CONVERSIONS: '🔄 Конверсії',
  LINK_CLICKS: '🖱️ Кліки',
  LANDING_PAGE_VIEWS: '📄 Перегляди',
  REACH: '👁️ Охоплення',
  IMPRESSIONS: '📊 Покази',
  THRUPLAY: '▶️ ThruPlay',
  VALUE: '💰 Цінність',
  REPLIES: '💬 Відповіді',
  ENGAGED_USERS: '❤️ Залученість',
  APP_INSTALLS: '📲 Встановлення',
  PURCHASE_ROAS: '📈 ROAS',
}

const CAMP_STATUS_COLOR: Record<string,string> = {
  ACTIVE:'#00c864', PAUSED:'#fbbf24', DELETED:'#ff4444', ARCHIVED:'rgba(255,255,255,0.35)', IN_PROCESS:'#60a5fa', WITH_ISSUES:'#f97316'
}

function fmt(v?: string) { return v ? parseFloat(v).toFixed(0) : '0' }
function fmtUSD(v?: string) { return v ? `$${parseFloat(v).toFixed(2)}` : '$0.00' }
function fmtPct(v?: string) { return v ? `${parseFloat(v).toFixed(2)}%` : '0%' }
function fmtNum(v?: string) { return v ? parseInt(v).toLocaleString() : '0' }

function parseLeads(actions?: any[]) {
  if (!actions) return 0
  return actions.filter(a=>a.action_type==='lead'||a.action_type==='offsite_conversion.fb_pixel_lead').reduce((s,a)=>s+Number(a.value),0)
}
function parsePurchases(actions?: any[]) {
  if (!actions) return 0
  return actions.filter(a=>a.action_type==='purchase'||a.action_type==='offsite_conversion.fb_pixel_purchase').reduce((s,a)=>s+Number(a.value),0)
}
function parseCPL(cpa?: any[]) {
  if (!cpa) return null
  const item = cpa.find(a=>a.action_type==='lead'||a.action_type==='offsite_conversion.fb_pixel_lead'||a.action_type==='purchase')
  return item ? `$${parseFloat(item.value).toFixed(2)}` : null
}

const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }
const thStyle = { padding:'11px 14px', textAlign:'left' as const, fontSize:'10px', fontWeight:600 as const, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace', whiteSpace:'nowrap' as const }
const tdStyle = { padding:'12px 14px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.6)', whiteSpace:'nowrap' as const }

const tabBtn = (active: boolean) => ({
  padding:'8px 16px', borderRadius:'7px', fontSize:'12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
  background: active?'rgba(230,0,0,0.12)':'transparent',
  color: active?'#ff4444':'rgba(255,255,255,0.4)',
  borderColor: active?'rgba(230,0,0,0.3)':'rgba(255,255,255,0.07)',
  display:'flex', alignItems:'center' as const, gap:'6px',
})

export default function MetaPage() {
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [dbClients, setDbClients] = useState<DbClient[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [selectedMeta, setSelectedMeta] = useState<MetaAccount|null>(null)
  const [selectedDbAccount, setSelectedDbAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'campaigns'|'adsets'>('campaigns')
  const [metaError, setMetaError] = useState<string|null>(null)
  const [period, setPeriod] = useState(30)

  const showToast = (msg:string, type:'ok'|'err') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  const loadDetails = async (account: MetaAccount, days: number) => {
    setLoadingDetails(true)
    setCampaigns([]); setAdsets([])
    const from = new Date(Date.now()-days*24*60*60*1000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]
    try {
      const res = await fetch(`/api/meta/campaigns?adAccountId=${account.id}&from=${from}&to=${to}`)
      const d = await res.json()
      setCampaigns(d.campaigns ?? [])
      setAdsets(d.adsets ?? [])
    } catch(e) { console.error(e) }
    setLoadingDetails(false)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [metaRes, clientsRes] = await Promise.all([fetch('/api/meta/accounts'), fetch('/api/clients')])
      const metaData = await metaRes.json()
      const clientsData = await clientsRes.json()
      if (metaData.error) { setMetaError(metaData.error); setLoading(false); return }
      setMetaAccounts(metaData)
      setDbClients(clientsData)
      if (metaData.length > 0) { setSelectedMeta(metaData[0]); loadDetails(metaData[0], 30) }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { if (selectedMeta) loadDetails(selectedMeta, period) }, [period])

  const handleSync = async () => {
    if (!selectedMeta || !selectedDbAccount) { showToast('Виберіть обидва кабінети', 'err'); return }
    setSyncing(true); setSyncResult(null)
    const from = new Date(Date.now()-period*24*60*60*1000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]
    const res = await fetch('/api/meta/sync', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accountId:selectedDbAccount, adAccountId:selectedMeta.id, from, to })
    })
    const data = await res.json()
    if (res.ok) { setSyncResult(data); showToast(`✓ Синхронізовано ${data.synced} днів`, 'ok') }
    else showToast(data.error ?? 'Помилка', 'err')
    setSyncing(false)
  }

  const totalSpend = campaigns.reduce((s,c)=>s+parseFloat(c.insights?.spend??'0'),0)
  const totalImpressions = campaigns.reduce((s,c)=>s+parseInt(c.insights?.impressions??'0'),0)
  const totalClicks = campaigns.reduce((s,c)=>s+parseInt(c.insights?.clicks??'0'),0)
  const totalReach = campaigns.reduce((s,c)=>s+parseInt(c.insights?.reach??'0'),0)
  const totalLeads = campaigns.reduce((s,c)=>s+parseLeads(c.insights?.actions),0)
  const totalPurchases = campaigns.reduce((s,c)=>s+parsePurchases(c.insights?.actions),0)
  const avgCTR = totalImpressions>0?(totalClicks/totalImpressions*100).toFixed(2):'0'
  const avgCPC = totalClicks>0?(totalSpend/totalClicks).toFixed(2):'0'
  const cpl = totalLeads>0?(totalSpend/totalLeads).toFixed(2):null

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar/>
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>

        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background:toast.type==='ok'?'rgba(0,200,100,0.12)':'rgba(230,0,0,0.12)', border:`1px solid ${toast.type==='ok'?'rgba(0,200,100,0.25)':'rgba(230,0,0,0.25)'}`, color:toast.type==='ok'?'#00c864':'#ff6b6b', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', animation:'slideUp 0.3s ease' }}>
            {toast.type==='ok'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}{toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'1400px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// META ADS API · РЕАЛЬНІ ДАНІ</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Meta інтеграція</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Facebook / Instagram Ads · {metaAccounts[0]?.name}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
              {[7,14,30,90].map(d=>(
                <button key={d} onClick={()=>setPeriod(d)} style={{ padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s', background:period===d?'rgba(230,0,0,0.12)':'transparent', color:period===d?'#ff4444':'rgba(255,255,255,0.4)', borderColor:period===d?'rgba(230,0,0,0.3)':'rgba(255,255,255,0.07)' }}>
                  {d} днів
                </button>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:metaError?'rgba(230,0,0,0.1)':'rgba(0,200,100,0.1)', border:`1px solid ${metaError?'rgba(230,0,0,0.2)':'rgba(0,200,100,0.2)'}` }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:metaError?'#ff4444':'#00c864', display:'inline-block' }}/>
                <span style={{ fontSize:'12px', fontWeight:600, color:metaError?'#ff4444':'#00c864' }}>{metaError?'Помилка':'Підключено'}</span>
              </div>
            </div>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'18px' }}>
            <svg width="100%" height="14" viewBox="0 0 1000 14" preserveAspectRatio="none">
              <path d="M0,7 C50,1 100,13 150,7 C200,1 250,13 300,7 C350,1 400,13 450,7 C500,1 550,13 600,7 C650,1 700,13 750,7 C800,1 850,13 900,7 C950,1 1000,13 1050,7" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px', flexDirection:'column', gap:'16px' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Підключення до Meta API...</p>
            </div>
          ) : metaError ? (
            <div style={{ background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'12px', padding:'40px', textAlign:'center' }}>
              <AlertCircle size={32} style={{ color:'#ff4444', margin:'0 auto 12px' }}/>
              <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{metaError}</p>
            </div>
          ) : (
            <>
              {/* KPI картки */}
              <div className="anim-up-1" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'10px', marginBottom:'14px' }}>
                {[
                  { label:'Витрати', value:`$${totalSpend.toFixed(0)}`, color:'#e60000', sub:`за ${period} днів` },
                  { label:'Охоплення', value:totalReach.toLocaleString(), color:'rgba(255,255,255,0.85)', sub:'Унікальні люди' },
                  { label:'Покази', value:totalImpressions.toLocaleString(), color:'rgba(255,255,255,0.85)', sub:'Impressions' },
                  { label:'Кліки', value:totalClicks.toLocaleString(), color:'rgba(255,255,255,0.85)', sub:'Link clicks' },
                  { label:'CTR', value:`${avgCTR}%`, color:'#fbbf24', sub:'Клікабельність' },
                  { label:'CPC', value:`$${avgCPC}`, color:'rgba(255,255,255,0.85)', sub:'Ціна кліку' },
                  {
                    label: totalLeads>0 ? 'Ліди' : totalPurchases>0 ? 'Покупки' : 'Конверсії',
                    value: (totalLeads>0?totalLeads:totalPurchases).toString(),
                    color:'#00c864',
                    sub: cpl ? `CPL: $${cpl}` : 'Конверсії'
                  },
                ].map(card=>(
                  <div key={card.label} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'14px 16px', transition:'border-color 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(230,0,0,0.2)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}}
                  >
                    <p style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>{card.label}</p>
                    <p style={{ fontSize:'18px', fontWeight:800, color:card.color, margin:'0 0 4px', fontFamily:'monospace' }}>{card.value}</p>
                    <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', margin:0 }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Синхронізація */}
              <div className="anim-up-2" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'18px 20px', marginBottom:'14px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' }}>Синхронізувати реальні дані в систему</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'12px', alignItems:'end' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>Meta кабінет</label>
                    <select value={selectedMeta?.id??''} onChange={e=>{const a=metaAccounts.find(x=>x.id===e.target.value)??null;setSelectedMeta(a);if(a)loadDetails(a,period)}} style={{ width:'100%', padding:'10px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none' }}>
                      {metaAccounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:'7px' }}>Кабінет в системі</label>
                    <select value={selectedDbAccount} onChange={e=>setSelectedDbAccount(e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none' }}>
                      <option value="">— Виберіть —</option>
                      {dbClients.map(c=>c.adAccounts.filter(a=>a.platform==='FACEBOOK').map(a=>(
                        <option key={a.id} value={a.id}>{c.name} · {a.name}</option>
                      )))}
                    </select>
                  </div>
                  <button onClick={handleSync} disabled={syncing||!selectedMeta||!selectedDbAccount}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:syncing?'#333':'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:(syncing||!selectedDbAccount)?'not-allowed':'pointer', opacity:(syncing||!selectedDbAccount)?0.6:1, transition:'all 0.15s', whiteSpace:'nowrap' as const }}
                    onMouseEnter={e=>{if(!syncing&&selectedDbAccount)e.currentTarget.style.background='#cc0000'}}
                    onMouseLeave={e=>{e.currentTarget.style.background=syncing?'#333':'#e60000'}}
                  >
                    <RefreshCw size={14} style={{animation:syncing?'spin 0.8s linear infinite':'none'}}/>
                    {syncing?'Синхронізація...':'Синхронізувати'}
                  </button>
                </div>
                {syncResult && (
                  <div style={{ marginTop:'12px', padding:'10px 16px', background:'rgba(0,200,100,0.08)', border:'1px solid rgba(0,200,100,0.2)', borderRadius:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <CheckCircle size={14} style={{color:'#00c864'}}/>
                    <span style={{ fontSize:'13px', color:'#00c864', fontWeight:600 }}>Синхронізовано {syncResult.synced} днів · {syncResult.from} → {syncResult.to}</span>
                  </div>
                )}
              </div>

              {/* Таблиці */}
              <div className="anim-up-3" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={()=>setActiveTab('campaigns')} style={tabBtn(activeTab==='campaigns')}><Target size={13}/>Кампанії ({campaigns.length})</button>
                    <button onClick={()=>setActiveTab('adsets')} style={tabBtn(activeTab==='adsets')}><Zap size={13}/>Адсети ({adsets.length})</button>
                  </div>
                  {loadingDetails && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'14px', height:'14px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>Завантаження...</span>
                    </div>
                  )}
                </div>

                <div style={{ overflowX:'auto' }}>
                  {activeTab==='campaigns' && (
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'1000px' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)' }}>
                          {['Кампанія','Статус','Ціль','Витрати','Охоплення','Покази','Кліки','CTR','CPC','CPP','Ліди','Покупки','CPL'].map(h=>(
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.length===0 && !loadingDetails ? (
                          <tr><td colSpan={13} style={{ padding:'48px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>Немає кампаній за обраний період</td></tr>
                        ) : campaigns.map(c=>{
                          const leads = parseLeads(c.insights?.actions)
                          const purchases = parsePurchases(c.insights?.actions)
                          const cpl = parseCPL(c.insights?.cost_per_action_type)
                          return (
                            <tr key={c.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s' }}
                              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
                            >
                              <td style={{ ...tdStyle, maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', color:'#fff', fontWeight:700 }} title={c.name}>{c.name}</td>
                              <td style={tdStyle}>
                                <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:`${CAMP_STATUS_COLOR[c.status]??'rgba(255,255,255,0.1)'}20`, color:CAMP_STATUS_COLOR[c.status]??'rgba(255,255,255,0.4)', fontWeight:700, border:`1px solid ${CAMP_STATUS_COLOR[c.status]??'rgba(255,255,255,0.1)'}50` }}>
                                  {c.status==='ACTIVE'?'● ACTIVE':c.status==='PAUSED'?'⏸ PAUSED':c.status}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>{OBJECTIVE_LABEL[c.objective]??c.objective}</td>
                              <td style={{ ...tdStyle, color:'#e60000', fontWeight:700 }}>${fmt(c.insights?.spend)}</td>
                              <td style={tdStyle}>{fmtNum(c.insights?.reach)}</td>
                              <td style={tdStyle}>{fmtNum(c.insights?.impressions)}</td>
                              <td style={tdStyle}>{fmtNum(c.insights?.clicks)}</td>
                              <td style={{ ...tdStyle, color:'#fbbf24' }}>{fmtPct(c.insights?.ctr)}</td>
                              <td style={tdStyle}>{fmtUSD(c.insights?.cpc)}</td>
                              <td style={tdStyle}>{fmtUSD(c.insights?.cpp)}</td>
                              <td style={{ ...tdStyle, color:leads>0?'#00c864':'rgba(255,255,255,0.25)' }}>{leads>0?leads:'—'}</td>
                              <td style={{ ...tdStyle, color:purchases>0?'#00c864':'rgba(255,255,255,0.25)' }}>{purchases>0?purchases:'—'}</td>
                              <td style={{ ...tdStyle, color:cpl?'#00c864':'rgba(255,255,255,0.25)' }}>{cpl??'—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab==='adsets' && (
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'900px' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:'rgba(255,255,255,0.01)' }}>
                          {['Адсет','Статус','Ціль оптимізації','Витрати','Охоплення','Покази','Кліки','CTR','CPC','Ліди','CPL'].map(h=>(
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {adsets.length===0 && !loadingDetails ? (
                          <tr><td colSpan={11} style={{ padding:'48px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>
                            Немає адсетів за обраний період
                            <br/><span style={{ fontSize:'11px', marginTop:'8px', display:'block', color:'rgba(255,255,255,0.15)' }}>Спробуйте збільшити період або перевірте кабінет</span>
                          </td></tr>
                        ) : adsets.map(a=>{
                          const leads = parseLeads(a.insights?.actions)
                          const cpl = parseCPL(a.insights?.cost_per_action_type)
                          const hasData = a.insights?.spend && parseFloat(a.insights.spend) > 0
                          return (
                            <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s', opacity: hasData ? 1 : 0.5 }}
                              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}
                            >
                              <td style={{ ...tdStyle, maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', color:'#fff', fontWeight:600 }} title={a.name}>{a.name}</td>
                              <td style={tdStyle}>
                                <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:`${CAMP_STATUS_COLOR[a.status]??'rgba(255,255,255,0.1)'}20`, color:CAMP_STATUS_COLOR[a.status]??'rgba(255,255,255,0.4)', fontWeight:700, border:`1px solid ${CAMP_STATUS_COLOR[a.status]??'rgba(255,255,255,0.1)'}50` }}>
                                  {a.status==='ACTIVE'?'● ACTIVE':a.status==='PAUSED'?'⏸ PAUSED':a.status}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>{OPT_LABEL[a.optimization_goal??'']??a.optimization_goal??'—'}</td>
                              <td style={{ ...tdStyle, color: hasData?'#e60000':'rgba(255,255,255,0.25)', fontWeight:hasData?700:400 }}>{hasData?`$${fmt(a.insights?.spend)}`:'—'}</td>
                              <td style={tdStyle}>{hasData?fmtNum(a.insights?.reach):'—'}</td>
                              <td style={tdStyle}>{hasData?fmtNum(a.insights?.impressions):'—'}</td>
                              <td style={tdStyle}>{hasData?fmtNum(a.insights?.clicks):'—'}</td>
                              <td style={{ ...tdStyle, color:hasData?'#fbbf24':'rgba(255,255,255,0.25)' }}>{hasData?fmtPct(a.insights?.ctr):'—'}</td>
                              <td style={tdStyle}>{hasData?fmtUSD(a.insights?.cpc):'—'}</td>
                              <td style={{ ...tdStyle, color:leads>0?'#00c864':'rgba(255,255,255,0.25)' }}>{leads>0?leads:'—'}</td>
                              <td style={{ ...tdStyle, color:cpl?'#00c864':'rgba(255,255,255,0.25)' }}>{cpl??'—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
