'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, CheckCircle, AlertCircle, X, Eye, EyeOff, RefreshCw, Clock, ChevronRight, ExternalLink } from 'lucide-react'

type Platform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK'

interface AdAccount {
  id: string; name: string; accountId: string; platform: Platform
  isActive: boolean; tokenStatus: string | null; createdAt: string; updatedAt: string
}

const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }
const defaultForm = { name:'', accountId:'', accessToken:'' }

const PLATFORMS = {
  FACEBOOK: { label:'Meta / Facebook', color:'#1877f2', bg:'rgba(24,119,242,0.1)', short:'META', autoSync:true },
  GOOGLE: { label:'Google Ads', color:'#e60000', bg:'rgba(230,0,0,0.1)', short:'GGL', autoSync:false },
  TIKTOK: { label:'TikTok Ads', color:'rgba(255,255,255,0.8)', bg:'rgba(255,255,255,0.07)', short:'TIK', autoSync:false },
}

const TOKEN_STATUS: Record<string, {label:string;color:string;bg:string}> = {
  valid: { label:'✓ Активний', color:'#00c864', bg:'rgba(0,200,100,0.1)' },
  invalid: { label:'✗ Недійсний', color:'#ff4444', bg:'rgba(230,0,0,0.1)' },
  no_token: { label:'— Без токена', color:'rgba(255,255,255,0.35)', bg:'rgba(255,255,255,0.05)' },
}

// Покрокові інструкції з скріншотами-описами
const INSTRUCTIONS: Record<Platform, {title:string; steps:{icon:string;title:string;desc:string;link?:string;linkText?:string}[]; idPlaceholder:string; tokenPlaceholder:string}> = {
  FACEBOOK: {
    title: 'Як підключити Meta / Facebook Ads',
    idPlaceholder: 'act_1234567890',
    tokenPlaceholder: 'EAAxxxxxxxxxx...',
    steps: [
      { icon:'1', title:'Знайди ID кабінету', desc:'Зайди в Meta Ads Manager → вгорі побачиш назву акаунту і поряд ID у форматі act_XXXXXXXXXX', link:'https://adsmanager.facebook.com', linkText:'Відкрити Ads Manager' },
      { icon:'2', title:'Відкрий Graph API Explorer', desc:'Натисни кнопку нижче щоб відкрити Graph API Explorer', link:'https://developers.facebook.com/tools/explorer', linkText:'Відкрити Graph API Explorer' },
      { icon:'3', title:'Згенеруй токен', desc:'У Graph API Explorer: 1) Вибери додаток "Infinite Union Ad Tracker" 2) Натисни "Generate Access Token" 3) Дозволь доступ до рекламних даних' },
      { icon:'4', title:'Скопіюй токен', desc:'Скопіюй довгий рядок що починається на EAA... і встав нижче. Токен дійсний 60 днів — потім треба оновити' },
    ]
  },
  GOOGLE: {
    title: 'Як підключити Google Ads',
    idPlaceholder: '123-456-7890',
    tokenPlaceholder: 'ya29.xxxxxxxx...',
    steps: [
      { icon:'1', title:'Знайди Customer ID', desc:'Зайди в Google Ads → у верхньому правому куті побачиш ID у форматі XXX-XXX-XXXX', link:'https://ads.google.com', linkText:'Відкрити Google Ads' },
      { icon:'2', title:'Отримай токен (опційно)', desc:'Для автосинхронізації потрібен OAuth токен. Зайди в Google Cloud Console та створи credentials', link:'https://console.cloud.google.com', linkText:'Google Cloud Console' },
      { icon:'3', title:'Вставте дані нижче', desc:'ID кабінету обовязковий. Токен опційний — без нього статистику треба завантажувати вручну через CSV' },
    ]
  },
  TIKTOK: {
    title: 'Як підключити TikTok Ads',
    idPlaceholder: '7890123456789',
    tokenPlaceholder: 'xxxxxxxxxxxxxxx...',
    steps: [
      { icon:'1', title:'Знайди Advertiser ID', desc:'Зайди в TikTok Ads Manager → Налаштування акаунту → скопіюй Advertiser ID', link:'https://ads.tiktok.com', linkText:'Відкрити TikTok Ads Manager' },
      { icon:'2', title:'Отримай токен (опційно)', desc:'Зайди на TikTok Business API Portal, створи додаток і отримай Access Token', link:'https://business-api.tiktok.com', linkText:'TikTok Business API' },
      { icon:'3', title:'Вставте дані нижче', desc:'ID кабінету обовязковий. З токеном статистика синхронізується автоматично' },
    ]
  }
}

export default function ConnectPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [showTokenModal, setShowTokenModal] = useState<AdAccount|null>(null)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [syncing, setSyncing] = useState<string|null>(null)
  const [step, setStep] = useState<'platform'|'guide'|'form'>('platform')
  const [forms, setForms] = useState<Record<Platform, typeof defaultForm>>({
    FACEBOOK: { ...defaultForm }, GOOGLE: { ...defaultForm }, TIKTOK: { ...defaultForm },
  })
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [focusedField, setFocusedField] = useState<string|null>(null)

  const showToast = (msg:string, type:'ok'|'err') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => {
    fetch('/api/my-accounts').then(r=>r.json()).then(d=>{ setAccounts(Array.isArray(d)?d:[]); setLoading(false) })
  }, [])

  const currentForm = selectedPlatform ? forms[selectedPlatform] : defaultForm
  const setCurrentForm = (updates: Partial<typeof defaultForm>) => {
    if (!selectedPlatform) return
    setForms(prev => ({ ...prev, [selectedPlatform]: { ...prev[selectedPlatform], ...updates } }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/my-accounts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...currentForm, platform: selectedPlatform })
    })
    if (res.ok) {
      const acc = await res.json()
      setAccounts(prev=>[acc,...prev])
      setForms(prev => ({ ...prev, [selectedPlatform!]: { ...defaultForm } }))
      setSelectedPlatform(null); setStep('platform')
      showToast('Кабінет підключено! Дані синхронізуються...', 'ok')
      if (acc.platform === 'FACEBOOK' && acc.tokenStatus === 'valid') {
        setTimeout(() => handleSync(acc), 1000)
      }
    } else {
      const d = await res.json(); showToast(d.error??'Помилка', 'err')
    }
    setSaving(false)
  }

  const handleSync = async (acc: AdAccount) => {
    setSyncing(acc.id)
    const from = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]
    const res = await fetch('/api/meta/sync', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accountId: acc.id, adAccountId: acc.accountId, from, to })
    })
    const data = await res.json()
    if (res.ok) showToast(`Синхронізовано ${data.synced} днів ✓`, 'ok')
    else showToast(data.error??'Помилка синхронізації', 'err')
    setSyncing(null)
  }

  const handleUpdateToken = async () => {
    if (!showTokenModal) return
    setTokenSaving(true)
    const res = await fetch(`/api/my-accounts/${showTokenModal.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ accessToken: tokenInput })
    })
    if (res.ok) {
      const d = await res.json()
      setAccounts(prev=>prev.map(a=>a.id===showTokenModal.id?{...a,tokenStatus:d.tokenStatus}:a))
      setShowTokenModal(null); setTokenInput('')
      showToast(d.tokenStatus==='valid'?'Токен підтверджено ✓':'Токен збережено', d.tokenStatus==='valid'?'ok':'err')
    } else {
      const d = await res.json(); showToast(d.error??'Помилка', 'err')
    }
    setTokenSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити кабінет?')) return
    setDeleting(id)
    const res = await fetch(`/api/my-accounts/${id}`, { method:'DELETE' })
    if (res.ok) { setAccounts(prev=>prev.filter(a=>a.id!==id)); showToast('Кабінет видалено', 'ok') }
    setDeleting(null)
  }

  const inp = (focused: boolean) => ({ width:'100%', padding:'12px 16px', background:'#161616', border:`1px solid ${focused?'#e60000':'rgba(255,255,255,0.07)'}`, borderRadius:'8px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' as const, transition:'all 0.2s', boxShadow:focused?'0 0 0 3px rgba(230,0,0,0.12)':'none' })

  const pInfo = selectedPlatform ? PLATFORMS[selectedPlatform] : null
  const instructions = selectedPlatform ? INSTRUCTIONS[selectedPlatform] : null

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar/>
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>

        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background:toast.type==='ok'?'rgba(0,200,100,0.12)':'rgba(230,0,0,0.12)', border:`1px solid ${toast.type==='ok'?'rgba(0,200,100,0.25)':'rgba(230,0,0,0.25)'}`, color:toast.type==='ok'?'#00c864':'#ff6b6b', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
            {toast.type==='ok'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}{toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'32px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// МОЇ РЕКЛАМНІ КАБІНЕТИ</p>
            <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Підключені кабінети</h1>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Підключіть рекламні кабінети — статистика завантажиться автоматично</p>
          </div>

          {/* Список підключених кабінетів */}
          {!loading && accounts.length > 0 && (
            <div style={{ marginBottom:'32px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {accounts.map((acc, i) => {
                  const p = PLATFORMS[acc.platform]
                  const ts = TOKEN_STATUS[acc.tokenStatus??'no_token']
                  return (
                    <div key={acc.id} className="anim-up" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'18px 22px', animationDelay:`${i*40}ms`, opacity:0 }} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(230,0,0,0.15)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                          <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:p.bg, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontSize:'9px', fontWeight:800, color:p.color, fontFamily:'monospace' }}>{p.short}</span>
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                              <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>{acc.name}</p>
                              <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:p.bg, color:p.color, fontWeight:600 }}>{p.label}</span>
                              {p.autoSync && acc.tokenStatus==='valid' && <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:'rgba(0,200,100,0.1)', color:'#00c864', fontWeight:600 }}>⚡ Автосинк</span>}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:0 }}>ID: {acc.accountId}</p>
                              <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:ts.bg, color:ts.color, fontWeight:600 }}>{ts.label}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          {acc.platform === 'FACEBOOK' && acc.tokenStatus === 'valid' && (
                            <button onClick={()=>handleSync(acc)} disabled={syncing===acc.id} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'rgba(0,200,100,0.08)', border:'1px solid rgba(0,200,100,0.2)', borderRadius:'7px', color:'#00c864', fontSize:'12px', fontWeight:600, cursor:'pointer', opacity:syncing===acc.id?0.6:1 }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,200,100,0.15)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,200,100,0.08)'}}>
                              <RefreshCw size={13} style={{animation:syncing===acc.id?'spin 0.8s linear infinite':'none'}}/>
                              {syncing===acc.id?'Синк...':'Оновити'}
                            </button>
                          )}
                          <button onClick={()=>{ setShowTokenModal(acc); setTokenInput('') }} style={{ padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'7px', color:'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:600, cursor:'pointer' }} onMouseEnter={e=>{e.currentTarget.style.color='#ff4444';e.currentTarget.style.borderColor='rgba(230,0,0,0.3)'}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.5)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                            {acc.tokenStatus==='valid'?'Оновити токен':'+ Додати токен'}
                          </button>
                          <button onClick={()=>handleDelete(acc.id)} disabled={deleting===acc.id} style={{ width:'36px', height:'36px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', color:'rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.color='#ff4444';e.currentTarget.style.background='rgba(230,0,0,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.25)';e.currentTarget.style.background='transparent'}}>
                            {deleting===acc.id?<div style={{width:'13px',height:'13px',border:'2px solid rgba(230,0,0,0.2)',borderTopColor:'#e60000',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<Trash2 size={14}/>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ВИБІР ПЛАТФОРМИ */}
          {!selectedPlatform && (
            <div className="anim-up-1">
              <p style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>
                {accounts.length > 0 ? '+ Додати ще кабінет' : 'Виберіть платформу'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS.FACEBOOK][]).map(([pl, p])=>(
                  <button key={pl} onClick={()=>{ setSelectedPlatform(pl); setStep('guide') }}
                    style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', padding:'28px 20px', cursor:'pointer', textAlign:'left' as const, transition:'all 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=p.color+'60';e.currentTarget.style.background='#161616'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.background='#111'}}
                  >
                    <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:p.bg, border:`1px solid ${p.color}40`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
                      <span style={{ fontSize:'11px', fontWeight:800, color:p.color, fontFamily:'monospace' }}>{p.short}</span>
                    </div>
                    <p style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:'0 0 6px' }}>{p.label}</p>
                    {p.autoSync
                      ? <p style={{ fontSize:'12px', color:'#00c864', margin:0, display:'flex', alignItems:'center', gap:'5px' }}>⚡ Автосинхронізація</p>
                      : <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', margin:0 }}>Ручне завантаження</p>
                    }
                    <div style={{ marginTop:'16px', display:'flex', alignItems:'center', gap:'4px', color:p.color, fontSize:'12px', fontWeight:600 }}>
                      Підключити <ChevronRight size={14}/>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ПОКРОКОВА ІНСТРУКЦІЯ */}
          {selectedPlatform && step === 'guide' && pInfo && instructions && (
            <div className="anim-up-1">
              <button onClick={()=>setSelectedPlatform(null)} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
                ← Назад
              </button>

              <div style={{ background:'#111', border:`1px solid ${pInfo.color}30`, borderRadius:'16px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ background:`linear-gradient(135deg, ${pInfo.bg}, rgba(0,0,0,0))`, padding:'28px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:pInfo.bg, border:`1px solid ${pInfo.color}40`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:'11px', fontWeight:800, color:pInfo.color, fontFamily:'monospace' }}>{pInfo.short}</span>
                    </div>
                    <div>
                      <p style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>{instructions.title}</p>
                      {pInfo.autoSync && <p style={{ fontSize:'12px', color:'#00c864', margin:'4px 0 0' }}>⚡ Після підключення дані завантажаться автоматично</p>}
                    </div>
                  </div>
                </div>

                <div style={{ padding:'28px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'28px' }}>
                    {instructions.steps.map((s, i)=>(
                      <div key={i} style={{ display:'flex', gap:'16px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:pInfo.bg, border:`1px solid ${pInfo.color}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'monospace', fontSize:'13px', fontWeight:800, color:pInfo.color }}>
                          {s.icon}
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:'0 0 6px' }}>{s.title}</p>
                          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.6 }}>{s.desc}</p>
                          {s.link && (
                            <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'10px', padding:'8px 16px', background:pInfo.bg, border:`1px solid ${pInfo.color}40`, borderRadius:'8px', color:pInfo.color, fontSize:'13px', fontWeight:600, textDecoration:'none', transition:'all 0.15s' }}>
                              <ExternalLink size={13}/>{s.linkText}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={()=>setStep('form')} style={{ width:'100%', padding:'14px', background:pInfo.color === 'rgba(255,255,255,0.8)' ? '#333' : pInfo.color, color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'10px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }}>
                    Я готовий — ввести дані →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ФОРМА ПІДКЛЮЧЕННЯ */}
          {selectedPlatform && step === 'form' && pInfo && instructions && (
            <div className="anim-up-1">
              <button onClick={()=>setStep('guide')} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer', marginBottom:'24px', padding:0 }}>
                ← Назад до інструкції
              </button>

              <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'32px' }}>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// КРОК 4 — ВВЕДІТЬ ДАНІ</p>
                <h2 style={{ fontSize:'20px', fontWeight:800, color:'#fff', margin:'0 0 24px' }}>Підключити {pInfo.label}</h2>

                <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.4)', marginBottom:'8px' }}>Назва кабінету</label>
                    <input value={currentForm.name} onChange={e=>setCurrentForm({name:e.target.value})} placeholder="напр. Основний · Ремаркетинг" required style={inp(focusedField==='name')} onFocus={()=>setFocusedField('name')} onBlur={()=>setFocusedField(null)}/>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:'6px' }}>Назва тільки для вас — щоб розрізняти кабінети</p>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.4)', marginBottom:'8px' }}>ID рекламного кабінету</label>
                    <input value={currentForm.accountId} onChange={e=>setCurrentForm({accountId:e.target.value})} placeholder={instructions.idPlaceholder} required style={inp(focusedField==='accountId')} onFocus={()=>setFocusedField('accountId')} onBlur={()=>setFocusedField(null)}/>
                    <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:'6px' }}>Знайди в рекламному кабінеті (крок 1 з інструкції)</p>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:pInfo.autoSync?'#00c864':'rgba(255,255,255,0.4)', marginBottom:'8px' }}>
                      Access Token {pInfo.autoSync ? '— для автосинхронізації ⚡' : '(опційно)'}
                    </label>
                    <div style={{ position:'relative' }}>
                      <input type={showToken?'text':'password'} value={currentForm.accessToken} onChange={e=>setCurrentForm({accessToken:e.target.value})} placeholder={instructions.tokenPlaceholder} style={{ ...inp(focusedField==='token'), paddingRight:'44px' }} onFocus={()=>setFocusedField('token')} onBlur={()=>setFocusedField(null)}/>
                      <button type="button" onClick={()=>setShowToken(!showToken)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>
                        {showToken?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                    {pInfo.autoSync && <p style={{ fontSize:'11px', color:'rgba(0,200,100,0.7)', marginTop:'6px' }}>З токеном дані завантажуються автоматично щодня</p>}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'12px' }}>
                    <button type="button" onClick={()=>{setSelectedPlatform(null);setStep('platform')}} style={{ padding:'13px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'rgba(255,255,255,0.4)', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
                      Скасувати
                    </button>
                    <button type="submit" disabled={saving} style={{ padding:'13px', background:saving?'#333':'#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'10px', border:'none', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }} onMouseEnter={e=>{if(!saving)e.currentTarget.style.background='#cc0000'}} onMouseLeave={e=>{e.currentTarget.style.background=saving?'#333':'#e60000'}}>
                      {saving?<><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Підключаємо...</>:'✓ Підключити кабінет'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Модал оновлення токена */}
      {showTokenModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={e=>{if(e.target===e.currentTarget){setShowTokenModal(null);setTokenInput('')}}}>
          <div className="anim-up" style={{ width:'100%', maxWidth:'480px', background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'28px', boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// ОНОВИТИ ТОКЕН</p>
                <h2 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>{showTokenModal.name}</h2>
              </div>
              <button onClick={()=>{setShowTokenModal(null);setTokenInput('')}} style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={15}/>
              </button>
            </div>

            {showTokenModal.platform === 'FACEBOOK' && (
              <div style={{ marginBottom:'16px', background:'rgba(24,119,242,0.06)', border:'1px solid rgba(24,119,242,0.15)', borderRadius:'8px', padding:'12px 14px' }}>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.6 }}>
                  Зайди на <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{color:'#1877f2',fontWeight:600}}>Graph API Explorer</a> → Generate Access Token → скопіюй і встав нижче
                </p>
              </div>
            )}

            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)', marginBottom:'8px' }}>Новий Access Token</label>
              <div style={{ position:'relative' }}>
                <input type={showToken?'text':'password'} value={tokenInput} onChange={e=>setTokenInput(e.target.value)} placeholder="Вставте токен..." style={{ width:'100%', padding:'12px 44px 12px 16px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' as const }} onFocus={e=>{e.target.style.borderColor='#e60000'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}}/>
                <button type="button" onClick={()=>setShowToken(!showToken)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer' }}>
                  {showToken?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>{setShowTokenModal(null);setTokenInput('')}} style={{ padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Скасувати</button>
              <button onClick={handleUpdateToken} disabled={tokenSaving||!tokenInput} style={{ padding:'12px', background:(tokenSaving||!tokenInput)?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:(tokenSaving||!tokenInput)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                {tokenSaving?<><div style={{width:'13px',height:'13px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Перевірка...</>:'Зберегти і перевірити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
