'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { ArrowLeft, Plus, Trash2, Power, AlertCircle, CheckCircle, Building2, Mail, Calendar, X } from 'lucide-react'

interface AdAccount { id:string; name:string; accountId:string; platform:string; isActive:boolean; createdAt:string }
interface ClientDetail {
  id:string; name:string; company:string
  user:{ email:string; name:string; createdAt:string }
  adAccounts: AdAccount[]
}

const PINFO: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  FACEBOOK: { label:'Meta / Facebook', color:'#1877f2', bg:'rgba(24,119,242,0.1)', dot:'#1877f2' },
  GOOGLE:   { label:'Google Ads',      color:'#e60000', bg:'rgba(230,0,0,0.1)',    dot:'#e60000' },
  TIKTOK:   { label:'TikTok Ads',      color:'#bbb',    bg:'rgba(255,255,255,0.07)', dot:'#fff' },
}

const inp = { width:'100%', padding:'11px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s, box-shadow 0.2s' }
const lbl = { display:'block', fontSize:'10px', fontWeight:600 as const, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:'7px' }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'} | null>(null)
  const [deleting, setDeleting] = useState<string|null>(null)
  const [toggling, setToggling] = useState<string|null>(null)
  const [form, setForm] = useState({ name:'', accountId:'', platform:'FACEBOOK' as 'FACEBOOK'|'GOOGLE'|'TIKTOK' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const showToast = (msg:string, type:'ok'|'err') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 3000)
  }

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r=>r.json()).then(d=>{ setClient(d); setLoading(false) })
  }, [id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormError('')
    const res = await fetch('/api/ad-accounts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clientId: id, ...form })
    })
    if (res.ok) {
      const acc = await res.json()
      setClient(prev => prev ? { ...prev, adAccounts: [acc, ...prev.adAccounts] } : prev)
      setForm({ name:'', accountId:'', platform:'FACEBOOK' })
      setShowModal(false)
      showToast('Кабінет додано успішно', 'ok')
    } else {
      const d = await res.json(); setFormError(d.error ?? 'Помилка')
    }
    setSaving(false)
  }

  const handleDelete = async (accId: string) => {
    if (!confirm('Видалити кабінет? Всі метрики буде втрачено.')) return
    setDeleting(accId)
    const res = await fetch(`/api/ad-accounts?id=${accId}`, { method:'DELETE' })
    if (res.ok) {
      setClient(prev => prev ? { ...prev, adAccounts: prev.adAccounts.filter(a=>a.id!==accId) } : prev)
      showToast('Кабінет видалено', 'ok')
    } else showToast('Помилка видалення', 'err')
    setDeleting(null)
  }

  const handleToggle = async (acc: AdAccount) => {
    setToggling(acc.id)
    const res = await fetch(`/api/ad-accounts?id=${acc.id}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ isActive: !acc.isActive })
    })
    if (res.ok) {
      const updated = await res.json()
      setClient(prev => prev ? { ...prev, adAccounts: prev.adAccounts.map(a=>a.id===acc.id ? {...a, isActive:updated.isActive} : a) } : prev)
      showToast(updated.isActive ? 'Кабінет активовано' : 'Кабінет деактивовано', 'ok')
    }
    setToggling(null)
  }

  const bg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0a' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    </div>
  )

  if (!client) return null

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={bg} />

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background: toast.type==='ok' ? 'rgba(0,200,100,0.12)' : 'rgba(230,0,0,0.12)', border:`1px solid ${toast.type==='ok' ? 'rgba(0,200,100,0.25)' : 'rgba(230,0,0,0.25)'}`, color: toast.type==='ok' ? '#00c864' : '#ff6b6b', animation:'slideUp 0.3s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
            {toast.type==='ok' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'32px' }}>
            <Link href="/admin/clients" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.3)', textDecoration:'none', marginBottom:'20px' }}>
              <ArrowLeft size={13}/>Назад до клієнтів
            </Link>

            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'22px', fontWeight:800, color:'#e60000' }}>{client.name[0].toUpperCase()}</span>
                </div>
                <div>
                  <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// КЛІЄНТ</p>
                  <h1 style={{ fontSize:'24px', fontWeight:800, color:'#fff', margin:0 }}>{client.name}</h1>
                  <div style={{ display:'flex', gap:'16px', marginTop:'6px' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Building2 size={11}/>{client.company}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Mail size={11}/>{client.user.email}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Calendar size={11}/>з {new Date(client.user.createdAt).toLocaleDateString('uk')}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>setShowModal(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{(e.currentTarget).style.background='#cc0000';(e.currentTarget).style.boxShadow='0 4px 20px rgba(230,0,0,0.35)';(e.currentTarget).style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{(e.currentTarget).style.background='#e60000';(e.currentTarget).style.boxShadow='none';(e.currentTarget).style.transform='none'}}
              ><Plus size={15}/>Додати кабінет</button>
            </div>
          </div>

          {/* Змія-роздільник */}
          <div style={{ marginBottom:'28px' }}>
            <svg width="100%" height="16" viewBox="0 0 800 16" preserveAspectRatio="none">
              <path d="M0,8 C40,2 80,14 120,8 C160,2 200,14 240,8 C280,2 320,14 360,8 C400,2 440,14 480,8 C520,2 560,14 600,8 C640,2 680,14 720,8 C760,2 800,14 840,8" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {/* Секція кабінетів */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// РЕКЛАМНІ КАБІНЕТИ</p>
                <p style={{ fontSize:'18px', fontWeight:700, color:'#fff', margin:0 }}>Підключені платформи</p>
              </div>
              <div style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>
                {client.adAccounts.length} кабінет{client.adAccounts.length===1?'':'ів'}
              </div>
            </div>

            {client.adAccounts.length === 0 ? (
              <div style={{ background:'#111', border:'1px dashed rgba(255,255,255,0.08)', borderRadius:'12px', padding:'48px', textAlign:'center' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Plus size={20} style={{color:'rgba(255,255,255,0.2)'}}/>
                </div>
                <p style={{ fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,0.5)', margin:'0 0 8px' }}>Немає підключених кабінетів</p>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', margin:'0 0 24px' }}>Додайте рекламний кабінет щоб відстежувати статистику</p>
                <button onClick={()=>setShowModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', color:'#ff4444', fontSize:'13px', fontWeight:600, borderRadius:'8px', cursor:'pointer' }}>
                  <Plus size={14}/>Додати перший кабінет
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {client.adAccounts.map((acc, i) => {
                  const p = PINFO[acc.platform] ?? { label:acc.platform, color:'#888', bg:'rgba(255,255,255,0.06)', dot:'#888' }
                  return (
                    <div key={acc.id} className="anim-up" style={{ background:'#111', border:`1px solid ${acc.isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, borderRadius:'12px', padding:'18px 22px', animationDelay:`${i*40}ms`, opacity:0, transition:'border-color 0.2s', display:'flex', alignItems:'center', justifyContent:'space-between' }}
                      onMouseEnter={e=>{(e.currentTarget).style.borderColor=acc.isActive?'rgba(230,0,0,0.2)':'rgba(255,255,255,0.06)'}}
                      onMouseLeave={e=>{(e.currentTarget).style.borderColor=acc.isActive?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                        {/* Іконка платформи */}
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:p.bg, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: acc.isActive ? 1 : 0.4 }}>
                          <span style={{ fontSize:'10px', fontWeight:800, color:p.color, fontFamily:'monospace' }}>
                            {acc.platform === 'FACEBOOK' ? 'META' : acc.platform === 'GOOGLE' ? 'GGL' : 'TIK'}
                          </span>
                        </div>
                        <div style={{ opacity: acc.isActive ? 1 : 0.5 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                            <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>{acc.name}</p>
                            <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:p.bg, color:p.color, fontWeight:600 }}>{p.label}</span>
                            {!acc.isActive && <span style={{ fontFamily:'monospace', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.3)' }}>НЕАКТИВНИЙ</span>}
                          </div>
                          <p style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:0 }}>ID: {acc.accountId}</p>
                        </div>
                      </div>

                      {/* Кнопки */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        {/* Toggle active */}
                        <button onClick={()=>handleToggle(acc)} disabled={toggling===acc.id}
                          title={acc.isActive ? 'Деактивувати' : 'Активувати'}
                          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background: acc.isActive ? 'rgba(0,200,100,0.08)' : 'rgba(255,255,255,0.04)', border:`1px solid ${acc.isActive ? 'rgba(0,200,100,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'7px', color: acc.isActive ? '#00c864' : 'rgba(255,255,255,0.3)', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.15s', opacity: toggling===acc.id ? 0.5 : 1 }}
                          onMouseEnter={e=>{if(toggling!==acc.id){(e.currentTarget).style.borderColor=acc.isActive?'rgba(0,200,100,0.4)':'rgba(255,255,255,0.15)'}}}
                          onMouseLeave={e=>{(e.currentTarget).style.borderColor=acc.isActive?'rgba(0,200,100,0.2)':'rgba(255,255,255,0.07)'}}
                        >
                          <Power size={13}/>{acc.isActive ? 'Активний' : 'Неактивний'}
                        </button>

                        {/* Delete */}
                        <button onClick={()=>handleDelete(acc.id)} disabled={deleting===acc.id}
                          title="Видалити кабінет"
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'36px', height:'36px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', color:'rgba(255,255,255,0.25)', cursor:'pointer', transition:'all 0.15s', opacity: deleting===acc.id ? 0.4 : 1 }}
                          onMouseEnter={e=>{(e.currentTarget).style.borderColor='rgba(230,0,0,0.3)';(e.currentTarget).style.color='#ff4444';(e.currentTarget).style.background='rgba(230,0,0,0.08)'}}
                          onMouseLeave={e=>{(e.currentTarget).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget).style.color='rgba(255,255,255,0.25)';(e.currentTarget).style.background='transparent'}}
                        >
                          {deleting===acc.id
                            ? <div style={{ width:'13px', height:'13px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                            : <Trash2 size={14}/>
                          }
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Модальне вікно — додати кабінет */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="anim-up" style={{ width:'100%', maxWidth:'480px', background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'32px', boxShadow:'0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'4px' }}>// НОВИЙ КАБІНЕТ</p>
                <h2 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Підключити платформу</h2>
              </div>
              <button onClick={()=>{setShowModal(false);setFormError('');setForm({name:'',accountId:'',platform:'FACEBOOK'})}}
                style={{ width:'32px', height:'32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={15}/>
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div style={{ marginBottom:'16px' }}>
                <label style={lbl}>Платформа</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {(['FACEBOOK','GOOGLE','TIKTOK'] as const).map(pl=>{
                    const p = PINFO[pl]
                    const active = form.platform===pl
                    return (
                      <button type="button" key={pl} onClick={()=>setForm({...form,platform:pl})}
                        style={{ padding:'12px 8px', borderRadius:'8px', border:`1px solid ${active ? p.color+'50' : 'rgba(255,255,255,0.07)'}`, background: active ? p.bg : 'rgba(255,255,255,0.03)', color: active ? p.color : 'rgba(255,255,255,0.35)', fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'all 0.15s', textAlign:'center' as const }}
                      >
                        <div style={{ fontSize:'10px', fontFamily:'monospace', marginBottom:'4px', letterSpacing:'0.05em' }}>
                          {pl==='FACEBOOK'?'META':pl==='GOOGLE'?'GOOGLE':'TIKTOK'}
                        </div>
                        <div style={{ fontSize:'10px', fontWeight:400, opacity:0.7 }}>
                          {pl==='FACEBOOK'?'Facebook / Instagram':pl==='GOOGLE'?'Google Ads':'TikTok Ads'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom:'16px' }}>
                <label style={lbl}>Назва кабінету</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="напр. Основний · Ремаркетинг" required style={inp}
                  onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}}
                />
              </div>

              <div style={{ marginBottom:'24px' }}>
                <label style={lbl}>ID рекламного кабінету</label>
                <input value={form.accountId} onChange={e=>setForm({...form,accountId:e.target.value})} placeholder={form.platform==='FACEBOOK'?'act_1234567890':form.platform==='GOOGLE'?'123-456-7890':'7890123456'} required style={inp}
                  onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}}
                />
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:'6px', fontFamily:'monospace' }}>
                  {form.platform==='FACEBOOK' && 'Знайди в Meta Business Suite → Налаштування → Рекламні акаунти'}
                  {form.platform==='GOOGLE' && 'Знайди у верхньому правому куті Google Ads → ID клієнта'}
                  {form.platform==='TIKTOK' && 'Знайди в TikTok Ads Manager → Налаштування акаунту'}
                </p>
              </div>

              {formError && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 14px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff6b6b', fontSize:'12px', marginBottom:'16px' }}>
                  <AlertCircle size={13}/>{formError}
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ width:'100%', padding:'13px', background: saving?'#333':'#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s' }}
                onMouseEnter={e=>{if(!saving){(e.currentTarget).style.background='#cc0000';(e.currentTarget).style.boxShadow='0 4px 20px rgba(230,0,0,0.35)'}}}
                onMouseLeave={e=>{(e.currentTarget).style.background='#e60000';(e.currentTarget).style.boxShadow='none'}}
              >
                {saving
                  ? <><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Підключаємо...</>
                  : 'Підключити кабінет →'
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
