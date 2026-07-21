'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, CheckCircle, AlertCircle, X, ExternalLink, Copy, Eye, EyeOff, Info } from 'lucide-react'

type Platform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK'

interface AdAccount {
  id: string; name: string; accountId: string; platform: Platform
  isActive: boolean; tokenStatus: string | null; createdAt: string
}

const PLATFORM_INFO = {
  FACEBOOK: {
    label: 'Meta / Facebook', color: '#1877f2', bg: 'rgba(24,119,242,0.1)',
    steps: [
      { step: '1', text: 'Зайди на', link: 'https://business.facebook.com/settings/ad-accounts', linkText: 'business.facebook.com' },
      { step: '2', text: 'Знайди свій рекламний кабінет і скопіюй його ID (формат: act_XXXXXXXXXX або просто цифри)' },
      { step: '3', text: 'Для Access Token: зайди на', link: 'https://developers.facebook.com/tools/explorer', linkText: 'Graph API Explorer' },
      { step: '4', text: 'Вибери свій додаток, натисни "Generate Access Token", додай дозволи ads_read та read_insights' },
      { step: '5', text: 'Скопіюй токен і встав нижче. Він дійсний 60 днів — потім треба оновити' },
    ],
    idPlaceholder: 'act_1234567890 або 1234567890',
    tokenPlaceholder: 'EAAxxxxxxxxxxxxx...',
  },
  GOOGLE: {
    label: 'Google Ads', color: '#e60000', bg: 'rgba(230,0,0,0.1)',
    steps: [
      { step: '1', text: 'Зайди в Google Ads → клікни іконку інструментів вгорі справа' },
      { step: '2', text: 'Знайди "ID клієнта" у верхньому правому куті — формат: XXX-XXX-XXXX' },
      { step: '3', text: 'Скопіюй ID і встав нижче (без дефісів)' },
    ],
    idPlaceholder: '123-456-7890',
    tokenPlaceholder: 'Google Access Token (опційно)',
  },
  TIKTOK: {
    label: 'TikTok Ads', color: '#fff', bg: 'rgba(255,255,255,0.07)',
    steps: [
      { step: '1', text: 'Зайди в TikTok Ads Manager → Налаштування акаунту' },
      { step: '2', text: 'Знайди "ID рекламного акаунту" у верхньому правому куті' },
      { step: '3', text: 'Скопіюй ID і встав нижче' },
    ],
    idPlaceholder: '7890123456789',
    tokenPlaceholder: 'TikTok Access Token (опційно)',
  },
}

const TOKEN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  valid: { label: '✓ Токен дійсний', color: '#00c864', bg: 'rgba(0,200,100,0.1)' },
  invalid: { label: '✗ Токен недійсний', color: '#ff4444', bg: 'rgba(230,0,0,0.1)' },
  no_token: { label: '— Без токена', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
}

const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }
const inp = (focused: boolean) => ({ width:'100%', padding:'11px 14px', background:'#161616', border:`1px solid ${focused?'#e60000':'rgba(255,255,255,0.07)'}`, borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s', boxShadow:focused?'0 0 0 3px rgba(230,0,0,0.12)':'none' })
const lbl = { display:'block', fontSize:'10px', fontWeight:600 as const, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:'8px' }

export default function ConnectPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState<AdAccount|null>(null)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('FACEBOOK')
  const [showSteps, setShowSteps] = useState(true)
  const [form, setForm] = useState({ name:'', accountId:'', accessToken:'' })
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [focusedField, setFocusedField] = useState<string|null>(null)
  const [copied, setCopied] = useState(false)

  const showToast = (msg:string, type:'ok'|'err') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  useEffect(() => {
    fetch('/api/my-accounts').then(r=>r.json()).then(d=>{ setAccounts(Array.isArray(d)?d:[]); setLoading(false) })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/my-accounts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, platform: selectedPlatform })
    })
    if (res.ok) {
      const acc = await res.json()
      setAccounts(prev=>[acc,...prev])
      setForm({ name:'', accountId:'', accessToken:'' })
      setShowModal(false)
      showToast('Кабінет підключено!', 'ok')
    } else {
      const d = await res.json(); showToast(d.error??'Помилка', 'err')
    }
    setSaving(false)
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
      showToast(d.tokenStatus==='valid'?'Токен підтверджено ✓':'Токен збережено (не вдалось перевірити)', d.tokenStatus==='valid'?'ok':'err')
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
    else showToast('Помилка', 'err')
    setDeleting(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  const pInfo = PLATFORM_INFO[selectedPlatform]

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

        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// МОЇ РЕКЛАМНІ КАБІНЕТИ</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Підключені кабінети</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Додайте свої рекламні кабінети для відстеження статистики</p>
            </div>
            <button onClick={()=>setShowModal(true)}
              style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#cc0000';e.currentTarget.style.boxShadow='0 4px 20px rgba(230,0,0,0.35)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='#e60000';e.currentTarget.style.boxShadow='none'}}
            >
              <Plus size={15}/>Додати кабінет
            </button>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'24px' }}>
            <svg width="100%" height="14" viewBox="0 0 700 14" preserveAspectRatio="none">
              <path d="M0,7 C40,1 80,13 120,7 C160,1 200,13 240,7 C280,1 320,13 360,7 C400,1 440,13 480,7 C520,1 560,13 600,7 C640,1 680,13 720,7" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {/* Список кабінетів */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px', flexDirection:'column', gap:'16px' }}>
              <div style={{ width:'28px', height:'28px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ background:'#111', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:'12px', padding:'60px 40px', textAlign:'center' }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Plus size={22} style={{color:'rgba(230,0,0,0.5)'}}/>
              </div>
              <p style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Немає підключених кабінетів</p>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', margin:'0 0 24px' }}>Додайте свій перший рекламний кабінет щоб почати відстежувати статистику</p>
              <button onClick={()=>setShowModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:'pointer' }}>
                <Plus size={14}/>Додати перший кабінет
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {accounts.map((acc, i) => {
                const p = PLATFORM_INFO[acc.platform]
                const ts = TOKEN_STATUS[acc.tokenStatus??'no_token']
                return (
                  <div key={acc.id} className="anim-up" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px 24px', animationDelay:`${i*40}ms`, opacity:0, transition:'border-color 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(230,0,0,0.15)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                        <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:p.bg, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:'9px', fontWeight:800, color:p.color, fontFamily:'monospace', letterSpacing:'0.05em' }}>
                            {acc.platform==='FACEBOOK'?'META':acc.platform==='GOOGLE'?'GGL':'TIK'}
                          </span>
                        </div>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                            <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>{acc.name}</p>
                            <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:p.bg, color:p.color, fontWeight:600 }}>{p.label}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:0 }}>ID: {acc.accountId}</p>
                            <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:ts.bg, color:ts.color, fontWeight:600 }}>{ts.label}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <button onClick={()=>{ setShowTokenModal(acc); setTokenInput('') }}
                          style={{ padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'7px', color:'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(230,0,0,0.3)';e.currentTarget.style.color='#ff4444'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(255,255,255,0.5)'}}
                        >
                          {acc.tokenStatus==='valid'?'Оновити токен':'Додати токен'}
                        </button>
                        <button onClick={()=>handleDelete(acc.id)} disabled={deleting===acc.id}
                          style={{ width:'36px', height:'36px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', color:'rgba(255,255,255,0.25)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(230,0,0,0.3)';e.currentTarget.style.color='#ff4444';e.currentTarget.style.background='rgba(230,0,0,0.08)'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.color='rgba(255,255,255,0.25)';e.currentTarget.style.background='transparent'}}
                        >
                          {deleting===acc.id?<div style={{width:'13px',height:'13px',border:'2px solid rgba(230,0,0,0.2)',borderTopColor:'#e60000',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:<Trash2 size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Модал — додати кабінет */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={e=>{if(e.target===e.currentTarget){setShowModal(false);setForm({name:'',accountId:'',accessToken:''})}}}>
          <div className="anim-up" style={{ width:'100%', maxWidth:'560px', background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'0', boxShadow:'0 24px 64px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto' }}>

            {/* Header модала */}
            <div style={{ padding:'24px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#111', zIndex:1 }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// НОВИЙ КАБІНЕТ</p>
                <h2 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Підключити платформу</h2>
              </div>
              <button onClick={()=>{setShowModal(false);setForm({name:'',accountId:'',accessToken:''})}} style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={15}/>
              </button>
            </div>

            <div style={{ padding:'24px 28px' }}>
              {/* Вибір платформи */}
              <div style={{ marginBottom:'20px' }}>
                <label style={lbl}>Платформа</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {(['FACEBOOK','GOOGLE','TIKTOK'] as Platform[]).map(pl=>{
                    const p = PLATFORM_INFO[pl]
                    const active = selectedPlatform===pl
                    return (
                      <button type="button" key={pl} onClick={()=>setSelectedPlatform(pl)}
                        style={{ padding:'14px 8px', borderRadius:'8px', border:`1px solid ${active?p.color+'50':'rgba(255,255,255,0.07)'}`, background:active?p.bg:'rgba(255,255,255,0.02)', color:active?p.color:'rgba(255,255,255,0.35)', fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'all 0.15s', textAlign:'center' as const }}
                      >
                        <div style={{ fontSize:'11px', fontFamily:'monospace', marginBottom:'5px', letterSpacing:'0.05em' }}>
                          {pl==='FACEBOOK'?'META':pl==='GOOGLE'?'GOOGLE':'TIKTOK'}
                        </div>
                        <div style={{ fontSize:'10px', fontWeight:400, opacity:0.7 }}>{p.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Інструкція */}
              <div style={{ marginBottom:'20px' }}>
                <button type="button" onClick={()=>setShowSteps(!showSteps)} style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', padding:'10px 14px', color:'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:600, cursor:'pointer', width:'100%', transition:'all 0.15s' }}>
                  <Info size={13} style={{color:'#fbbf24'}}/>
                  Де знайти ID кабінету та токен?
                  <span style={{ marginLeft:'auto', fontSize:'10px' }}>{showSteps?'▲ Сховати':'▼ Показати'}</span>
                </button>
                {showSteps && (
                  <div style={{ marginTop:'10px', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'8px', padding:'14px 16px' }}>
                    {pInfo.steps.map((s,i)=>(
                      <div key={i} style={{ display:'flex', gap:'10px', marginBottom: i<pInfo.steps.length-1?'10px':0 }}>
                        <span style={{ minWidth:'20px', height:'20px', borderRadius:'50%', background:'rgba(251,191,36,0.15)', color:'#fbbf24', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'monospace' }}>{s.step}</span>
                        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.55)', margin:0, lineHeight:1.5 }}>
                          {s.text}{' '}
                          {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color:'#1877f2', textDecoration:'none', fontWeight:600 }}>{s.linkText} <ExternalLink size={10} style={{display:'inline',verticalAlign:'middle'}}/></a>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAdd}>
                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>Назва кабінету</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="напр. Основний · Ремаркетинг" required style={inp(focusedField==='name')}
                    onFocus={()=>setFocusedField('name')} onBlur={()=>setFocusedField(null)}
                  />
                </div>

                <div style={{ marginBottom:'14px' }}>
                  <label style={lbl}>ID рекламного кабінету</label>
                  <input value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})} placeholder={pInfo.idPlaceholder} required style={inp(focusedField==='accountId')}
                    onFocus={()=>setFocusedField('accountId')} onBlur={()=>setFocusedField(null)}
                  />
                </div>

                <div style={{ marginBottom:'20px' }}>
                  <label style={lbl}>Access Token <span style={{ color:'rgba(255,255,255,0.25)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(опційно — для автосинхронізації)</span></label>
                  <div style={{ position:'relative' }}>
                    <input type={showToken?'text':'password'} value={form.accessToken} onChange={e=>setForm({...form,accessToken:e.target.value})} placeholder={pInfo.tokenPlaceholder} style={{ ...inp(focusedField==='token'), paddingRight:'44px' }}
                      onFocus={()=>setFocusedField('token')} onBlur={()=>setFocusedField(null)}
                    />
                    <button type="button" onClick={()=>setShowToken(!showToken)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'4px' }}>
                      {showToken?<EyeOff size={15}/>:<Eye size={15}/>}
                    </button>
                  </div>
                  <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)', marginTop:'6px' }}>
                    ⚠️ Токен передається захищено і зберігається в зашифрованому вигляді
                  </p>
                </div>

                <button type="submit" disabled={saving}
                  style={{ width:'100%', padding:'13px', background:saving?'#333':'#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }}
                  onMouseEnter={e=>{if(!saving){e.currentTarget.style.background='#cc0000';e.currentTarget.style.boxShadow='0 4px 20px rgba(230,0,0,0.35)'}}}
                  onMouseLeave={e=>{e.currentTarget.style.background=saving?'#333':'#e60000';e.currentTarget.style.boxShadow='none'}}
                >
                  {saving?<><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Підключаємо...</>:'Підключити кабінет →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модал — оновити токен */}
      {showTokenModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={e=>{if(e.target===e.currentTarget){setShowTokenModal(null);setTokenInput('')}}}>
          <div className="anim-up" style={{ width:'100%', maxWidth:'480px', background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'28px', boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// ACCESS TOKEN</p>
                <h2 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>{showTokenModal.name}</h2>
              </div>
              <button onClick={()=>{setShowTokenModal(null);setTokenInput('')}} style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={15}/>
              </button>
            </div>

            {showTokenModal.platform === 'FACEBOOK' && (
              <div style={{ marginBottom:'16px', background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'8px', padding:'12px 14px' }}>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', margin:'0 0 8px', fontWeight:600 }}>Як отримати токен:</p>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0, lineHeight:1.6 }}>
                  1. Зайди на <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{color:'#1877f2'}}>Graph API Explorer</a><br/>
                  2. Вибери свій додаток<br/>
                  3. Натисни "Generate Access Token"<br/>
                  4. Додай дозволи: <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 6px',borderRadius:'3px',fontSize:'11px'}}>ads_read</code> <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 6px',borderRadius:'3px',fontSize:'11px'}}>read_insights</code><br/>
                  5. Скопіюй і встав токен нижче
                </p>
              </div>
            )}

            <div style={{ marginBottom:'16px' }}>
              <label style={lbl}>Access Token</label>
              <div style={{ position:'relative' }}>
                <input type={showToken?'text':'password'} value={tokenInput} onChange={e=>setTokenInput(e.target.value)} placeholder="EAAxxxxxxxxxxxxx..." style={{ ...inp(focusedField==='tokenModal'), paddingRight:'44px' }}
                  onFocus={()=>setFocusedField('tokenModal')} onBlur={()=>setFocusedField(null)}
                />
                <button type="button" onClick={()=>setShowToken(!showToken)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'4px' }}>
                  {showToken?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <button onClick={()=>{setShowTokenModal(null);setTokenInput('')}} style={{ padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                Скасувати
              </button>
              <button onClick={handleUpdateToken} disabled={tokenSaving||!tokenInput}
                style={{ padding:'12px', background:(tokenSaving||!tokenInput)?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:(tokenSaving||!tokenInput)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }}
                onMouseEnter={e=>{if(!tokenSaving&&tokenInput){e.currentTarget.style.background='#cc0000'}}}
                onMouseLeave={e=>{e.currentTarget.style.background=(tokenSaving||!tokenInput)?'rgba(230,0,0,0.3)':'#e60000'}}
              >
                {tokenSaving?<><div style={{width:'13px',height:'13px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Перевіряємо...</>:'Зберегти та перевірити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
