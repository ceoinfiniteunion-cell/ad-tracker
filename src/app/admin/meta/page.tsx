'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { RefreshCw, CheckCircle, AlertCircle, ChevronDown, ExternalLink, Zap, BarChart2, Target } from 'lucide-react'

interface MetaAccount { id:string; name:string; account_id:string; account_status:number; currency:string }
interface DbClient { id:string; name:string; company:string; adAccounts:{ id:string; name:string; accountId:string; platform:string }[] }
interface Campaign { id:string; name:string; status:string; objective:string; insights?:{ spend:string; impressions:string; clicks:string; ctr:string } }
interface AdSet { id:string; name:string; status:string; campaign_id:string; insights?:{ spend:string; impressions:string; clicks:string } }

const STATUS_LABEL: Record<number,string> = { 1:'Активний', 2:'Вимкнений', 3:'Видалений', 7:'Архів', 9:'Очікує', 100:'Повторна перевірка', 101:'Повторна перевірка', 201:'Ліміт' }
const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }

export default function MetaIntegrationPage() {
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([])
  const [dbClients, setDbClients] = useState<DbClient[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [selectedMeta, setSelectedMeta] = useState<MetaAccount|null>(null)
  const [selectedDbAccount, setSelectedDbAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [syncResult, setSyncResult] = useState<{synced:number;from:string;to:string}|null>(null)
  const [activeTab, setActiveTab] = useState<'overview'|'campaigns'|'adsets'>('overview')
  const [metaError, setMetaError] = useState<string|null>(null)

  const showToast = (msg:string, type:'ok'|'err') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [metaRes, clientsRes] = await Promise.all([
        fetch('/api/meta/accounts'),
        fetch('/api/clients')
      ])
      const metaData = await metaRes.json()
      const clientsData = await clientsRes.json()

      if (metaData.error) { setMetaError(metaData.error); setLoading(false); return }
      setMetaAccounts(metaData)
      setDbClients(clientsData)
      if (metaData.length > 0) setSelectedMeta(metaData[0])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedMeta) return
    setLoadingCampaigns(true)
    const d30 = new Date(); d30.setDate(d30.getDate()-30)
    fetch(`/api/meta/campaigns?adAccountId=${selectedMeta.id}&from=${d30.toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}`)
      .then(r=>r.json()).then(d=>{ setCampaigns(d.campaigns??[]); setAdsets(d.adsets??[]); setLoadingCampaigns(false) })
      .catch(()=>setLoadingCampaigns(false))
  }, [selectedMeta])

  const handleSync = async () => {
    if (!selectedMeta || !selectedDbAccount) { showToast('Виберіть Meta кабінет і DB кабінет', 'err'); return }
    setSyncing(true); setSyncResult(null)
    const d30 = new Date(); d30.setDate(d30.getDate()-30)
    const res = await fetch('/api/meta/sync', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accountId:selectedDbAccount, adAccountId:selectedMeta.id, from:d30.toISOString().split('T')[0], to:new Date().toISOString().split('T')[0] })
    })
    const data = await res.json()
    if (res.ok) { setSyncResult(data); showToast(`Синхронізовано ${data.synced} днів`, 'ok') }
    else showToast(data.error ?? 'Помилка синхронізації', 'err')
    setSyncing(false)
  }

  const tabStyle = (active: boolean) => ({
    padding:'8px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? 'rgba(230,0,0,0.12)' : 'transparent',
    color: active ? '#ff4444' : 'rgba(255,255,255,0.4)',
    borderColor: active ? 'rgba(230,0,0,0.3)' : 'rgba(255,255,255,0.07)',
  })

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>

        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background:toast.type==='ok'?'rgba(0,200,100,0.12)':'rgba(230,0,0,0.12)', border:`1px solid ${toast.type==='ok'?'rgba(0,200,100,0.25)':'rgba(230,0,0,0.25)'}`, color:toast.type==='ok'?'#00c864':'#ff6b6b', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', animation:'slideUp 0.3s ease' }}>
            {toast.type==='ok'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}{toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'28px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// META ADS API</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Meta інтеграція</h1>
                <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Синхронізація даних з Facebook / Instagram Ads</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background: metaError ? 'rgba(230,0,0,0.1)' : 'rgba(0,200,100,0.1)', border:`1px solid ${metaError?'rgba(230,0,0,0.2)':'rgba(0,200,100,0.2)'}` }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: metaError?'#ff4444':'#00c864', display:'inline-block' }}/>
                  <span style={{ fontSize:'12px', fontWeight:600, color: metaError?'#ff4444':'#00c864' }}>{metaError ? 'Помилка з\'єднання' : 'Підключено'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'24px' }}>
            <svg width="100%" height="16" viewBox="0 0 1000 16" preserveAspectRatio="none">
              <path d="M0,8 C50,2 100,14 150,8 C200,2 250,14 300,8 C350,2 400,14 450,8 C500,2 550,14 600,8 C650,2 700,14 750,8 C800,2 850,14 900,8 C950,2 1000,14 1050,8" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0', flexDirection:'column', gap:'16px' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Підключення до Meta API...</p>
            </div>
          ) : metaError ? (
            <div style={{ background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'12px', padding:'32px', textAlign:'center' }}>
              <AlertCircle size={32} style={{ color:'#ff4444', margin:'0 auto 16px' }}/>
              <p style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Помилка підключення до Meta API</p>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:'0 0 16px', fontFamily:'monospace' }}>{metaError}</p>
              <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>Перевір META_ACCESS_TOKEN в .env.local</p>
            </div>
          ) : (
            <>
              {/* Вибір кабінету + синхронізація */}
              <div className="anim-up-1" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px', marginBottom:'16px' }}>
                <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 16px' }}>Налаштування синхронізації</p>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'12px', alignItems:'end' }}>
                  {/* Meta кабінет */}
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'8px' }}>Meta рекламний кабінет</label>
                    <select value={selectedMeta?.id ?? ''} onChange={e=>setSelectedMeta(metaAccounts.find(a=>a.id===e.target.value)??null)}
                      style={{ width:'100%', padding:'11px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23555' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
                      {metaAccounts.map(a=>(
                        <option key={a.id} value={a.id}>{a.name} · {a.currency} · {STATUS_LABEL[a.account_status]??'Невідомо'}</option>
                      ))}
                    </select>
                  </div>

                  {/* DB кабінет */}
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:'8px' }}>Кабінет в системі (DB)</label>
                    <select value={selectedDbAccount} onChange={e=>setSelectedDbAccount(e.target.value)}
                      style={{ width:'100%', padding:'11px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23555' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center' }}>
                      <option value="">— Виберіть кабінет —</option>
                      {dbClients.map(c=>c.adAccounts.filter(a=>a.platform==='FACEBOOK').map(a=>(
                        <option key={a.id} value={a.id}>{c.name} · {a.name} · {a.accountId}</option>
                      )))}
                    </select>
                  </div>

                  {/* Кнопка синк */}
                  <button onClick={handleSync} disabled={syncing || !selectedMeta || !selectedDbAccount}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 20px', background: syncing?'#333':'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:(syncing||!selectedMeta||!selectedDbAccount)?'not-allowed':'pointer', transition:'all 0.15s', whiteSpace:'nowrap' as const, opacity:(syncing||!selectedDbAccount)?0.6:1 }}
                    onMouseEnter={e=>{ if(!syncing&&selectedDbAccount)(e.currentTarget).style.background='#cc0000' }}
                    onMouseLeave={e=>{ (e.currentTarget).style.background=syncing?'#333':'#e60000' }}
                  >
                    <RefreshCw size={14} style={{ animation: syncing?'spin 0.8s linear infinite':'none' }}/>
                    {syncing ? 'Синхронізація...' : 'Синхронізувати'}
                  </button>
                </div>

                {syncResult && (
                  <div style={{ marginTop:'16px', padding:'12px 16px', background:'rgba(0,200,100,0.08)', border:'1px solid rgba(0,200,100,0.2)', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <CheckCircle size={15} style={{color:'#00c864', flexShrink:0}}/>
                    <span style={{ fontSize:'13px', color:'#00c864', fontWeight:600 }}>
                      Успішно! Синхронізовано <strong>{syncResult.synced}</strong> днів · {syncResult.from} → {syncResult.to}
                    </span>
                  </div>
                )}
              </div>

              {/* Meta кабінети */}
              <div className="anim-up-2" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>Meta рекламні кабінети ({metaAccounts.length})</p>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      {['Кабінет','ID','Статус','Валюта'].map(h=>(
                        <th key={h} style={{ padding:'11px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metaAccounts.map(acc=>(
                      <tr key={acc.id} onClick={()=>setSelectedMeta(acc)} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer', transition:'background 0.15s', background: selectedMeta?.id===acc.id?'rgba(230,0,0,0.06)':'transparent' }}
                        onMouseEnter={e=>{ if(selectedMeta?.id!==acc.id)(e.currentTarget).style.background='rgba(255,255,255,0.02)' }}
                        onMouseLeave={e=>{ (e.currentTarget).style.background=selectedMeta?.id===acc.id?'rgba(230,0,0,0.06)':'transparent' }}
                      >
                        <td style={{ padding:'14px 16px', fontSize:'13px', fontWeight:600, color:'#fff' }}>{acc.name}</td>
                        <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{acc.account_id}</td>
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ fontFamily:'monospace', fontSize:'11px', padding:'3px 8px', borderRadius:'4px', background: acc.account_status===1?'rgba(0,200,100,0.1)':'rgba(255,255,255,0.05)', color: acc.account_status===1?'#00c864':'rgba(255,255,255,0.4)', fontWeight:600 }}>
                            {STATUS_LABEL[acc.account_status]??'Невідомо'}
                          </span>
                        </td>
                        <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{acc.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Кампанії / Адсети */}
              {selectedMeta && (
                <div className="anim-up-3" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', overflow:'hidden' }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button onClick={()=>setActiveTab('campaigns')} style={tabStyle(activeTab==='campaigns')}>
                        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><Target size={13}/>Кампанії ({campaigns.length})</span>
                      </button>
                      <button onClick={()=>setActiveTab('adsets')} style={tabStyle(activeTab==='adsets')}>
                        <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><Zap size={13}/>Адсети ({adsets.length})</span>
                      </button>
                    </div>
                    {loadingCampaigns && <div style={{ width:'16px', height:'16px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>}
                  </div>

                  {activeTab==='campaigns' && (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          {['Назва','Статус','Ціль','Витрати','Покази','Кліки','CTR'].map(h=>(
                            <th key={h} style={{ padding:'11px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.length===0 ? (
                          <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>Немає кампаній за останні 30 днів</td></tr>
                        ) : campaigns.map(c=>(
                          <tr key={c.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s' }}
                            onMouseEnter={e=>{ (e.currentTarget).style.background='rgba(255,255,255,0.02)' }}
                            onMouseLeave={e=>{ (e.currentTarget).style.background='transparent' }}
                          >
                            <td style={{ padding:'13px 16px', fontSize:'13px', fontWeight:600, color:'#fff', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{c.name}</td>
                            <td style={{ padding:'13px 16px' }}>
                              <span style={{ fontFamily:'monospace', fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background: c.status==='ACTIVE'?'rgba(0,200,100,0.1)':'rgba(255,255,255,0.05)', color: c.status==='ACTIVE'?'#00c864':'rgba(255,255,255,0.4)', fontWeight:600 }}>{c.status}</span>
                            </td>
                            <td style={{ padding:'13px 16px', fontSize:'12px', color:'rgba(255,255,255,0.4)', fontFamily:'monospace' }}>{c.objective}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'13px', color:'#e60000', fontWeight:700 }}>${parseFloat(c.insights?.spend??'0').toFixed(0)}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{parseInt(c.insights?.impressions??'0').toLocaleString()}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{parseInt(c.insights?.clicks??'0').toLocaleString()}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{parseFloat(c.insights?.ctr??'0').toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activeTab==='adsets' && (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          {['Назва','Статус','Витрати','Покази','Кліки'].map(h=>(
                            <th key={h} style={{ padding:'11px 16px', textAlign:'left' as const, fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)', textTransform:'uppercase' as const, letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {adsets.length===0 ? (
                          <tr><td colSpan={5} style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'13px' }}>Немає адсетів</td></tr>
                        ) : adsets.map(a=>(
                          <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.15s' }}
                            onMouseEnter={e=>{ (e.currentTarget).style.background='rgba(255,255,255,0.02)' }}
                            onMouseLeave={e=>{ (e.currentTarget).style.background='transparent' }}
                          >
                            <td style={{ padding:'13px 16px', fontSize:'13px', fontWeight:600, color:'#fff', maxWidth:'240px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{a.name}</td>
                            <td style={{ padding:'13px 16px' }}>
                              <span style={{ fontFamily:'monospace', fontSize:'11px', padding:'2px 8px', borderRadius:'4px', background: a.status==='ACTIVE'?'rgba(0,200,100,0.1)':'rgba(255,255,255,0.05)', color: a.status==='ACTIVE'?'#00c864':'rgba(255,255,255,0.4)', fontWeight:600 }}>{a.status}</span>
                            </td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'13px', color:'#e60000', fontWeight:700 }}>${parseFloat(a.insights?.spend??'0').toFixed(0)}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{parseInt(a.insights?.impressions??'0').toLocaleString()}</td>
                            <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{parseInt(a.insights?.clicks??'0').toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
