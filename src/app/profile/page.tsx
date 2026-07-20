'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Lock, Mail, Building2, Calendar, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

const gridBg = { position:'fixed' as const, inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' as const, zIndex:0 }
const inp = (focused: boolean) => ({ width:'100%', padding:'12px 16px', background:'#161616', border:`1px solid ${focused ? '#e60000' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s, box-shadow 0.2s', boxShadow: focused ? '0 0 0 3px rgba(230,0,0,0.12)' : 'none' })
const lbl = { display:'block', fontSize:'11px', fontWeight:600 as const, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:'8px' }

interface Profile { id:string; name:string; email:string; role:string; createdAt:string; client?:{ company:string } }

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Форма імені
  const [name, setName] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)

  // Форма пароля
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [focusedField, setFocusedField] = useState<string|null>(null)

  // Toast
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)

  const showToast = (msg:string, type:'ok'|'err') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500)
  }

  useEffect(() => {
    fetch('/api/profile').then(r=>r.json()).then(d=>{ setProfile(d); setName(d.name); setLoading(false) })
  }, [])

  const handleNameSave = async () => {
    if (!name.trim() || name === profile?.name) return
    setNameSaving(true)
    const res = await fetch('/api/profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) })
    if (res.ok) {
      const d = await res.json()
      setProfile(prev => prev ? {...prev, name:d.name} : prev)
      await updateSession({ name: d.name })
      showToast("Ім'я оновлено", 'ok')
    } else {
      const d = await res.json(); showToast(d.error, 'err')
    }
    setNameSaving(false)
  }

  const handlePwdSave = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { showToast('Заповніть всі поля', 'err'); return }
    if (newPwd !== confirmPwd) { showToast('Паролі не співпадають', 'err'); return }
    if (newPwd.length < 8) { showToast('Мінімум 8 символів', 'err'); return }
    setPwdSaving(true)
    const res = await fetch('/api/profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currentPassword:currentPwd, newPassword:newPwd }) })
    if (res.ok) {
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      showToast('Пароль змінено успішно', 'ok')
    } else {
      const d = await res.json(); showToast(d.error, 'err')
    }
    setPwdSaving(false)
  }

  const pwdStrength = (pwd: string) => {
    if (!pwd) return null
    if (pwd.length < 6) return { label:'Слабкий', color:'#ff4444', w:'25%' }
    if (pwd.length < 8) return { label:'Середній', color:'#fbbf24', w:'50%' }
    if (pwd.length < 12) return { label:'Добрий', color:'#00c864', w:'75%' }
    return { label:'Відмінний', color:'#00c864', w:'100%' }
  }
  const strength = pwdStrength(newPwd)

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:'#0a0a0a' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>
        <div style={{ position:'fixed', top:'-80px', left:'30%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(230,0,0,0.05) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background: toast.type==='ok' ? 'rgba(0,200,100,0.12)' : 'rgba(230,0,0,0.12)', border:`1px solid ${toast.type==='ok' ? 'rgba(0,200,100,0.25)' : 'rgba(230,0,0,0.25)'}`, color: toast.type==='ok' ? '#00c864' : '#ff6b6b', animation:'slideUp 0.3s ease', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
            {toast.type==='ok' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}{toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'720px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'32px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// ПРОФІЛЬ</p>
            <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Налаштування акаунту</h1>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Керуйте своїми даними та безпекою</p>
          </div>

          {/* Змія */}
          <div style={{ marginBottom:'28px' }}>
            <svg width="100%" height="16" viewBox="0 0 700 16" preserveAspectRatio="none">
              <path d="M0,8 C40,2 80,14 120,8 C160,2 200,14 240,8 C280,2 320,14 360,8 C400,2 440,14 480,8 C520,2 560,14 600,8 C640,2 680,14 720,8" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="6 6"/>
            </svg>
          </div>

          {/* Інфо картка */}
          <div className="anim-up-1" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'20px' }}>
            <div style={{ width:'60px', height:'60px', borderRadius:'16px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'24px', fontWeight:800, color:'#e60000' }}>{profile?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>{profile?.name}</p>
              <div style={{ display:'flex', gap:'16px', marginTop:'6px', flexWrap:'wrap' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Mail size={11}/>{profile?.email}</span>
                {profile?.client?.company && <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Building2 size={11}/>{profile.client.company}</span>}
                <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Calendar size={11}/>з {new Date(profile?.createdAt ?? '').toLocaleDateString('uk', {day:'2-digit',month:'long',year:'numeric'})}</span>
              </div>
            </div>
            <div style={{ fontFamily:'monospace', fontSize:'10px', padding:'4px 10px', borderRadius:'4px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', color:'#ff4444', fontWeight:700 }}>
              {profile?.role}
            </div>
          </div>

          {/* Зміна імені */}
          <div className="anim-up-2" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <User size={15} style={{color:'rgba(255,255,255,0.4)'}}/>
              </div>
              <div>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>Особисті дані</p>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>Оновіть своє ім'я</p>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'12px', alignItems:'end' }}>
              <div>
                <label style={lbl}>Ім'я</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ваше ім'я" style={inp(nameFocused)}
                  onFocus={()=>setNameFocused(true)} onBlur={()=>setNameFocused(false)}
                  onKeyDown={e=>{ if(e.key==='Enter') handleNameSave() }}
                />
              </div>
              <button onClick={handleNameSave} disabled={nameSaving || !name.trim() || name===profile?.name}
                style={{ padding:'12px 20px', background: (nameSaving || !name.trim() || name===profile?.name) ? 'rgba(230,0,0,0.3)' : '#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', border:'none', cursor: (nameSaving || !name.trim() || name===profile?.name) ? 'not-allowed' : 'pointer', transition:'all 0.15s', whiteSpace:'nowrap' as const }}
                onMouseEnter={e=>{ if(!nameSaving && name.trim() && name!==profile?.name) { e.currentTarget.style.background='#cc0000'; e.currentTarget.style.boxShadow='0 4px 16px rgba(230,0,0,0.3)' }}}
                onMouseLeave={e=>{ e.currentTarget.style.background=(nameSaving||!name.trim()||name===profile?.name)?'rgba(230,0,0,0.3)':'#e60000'; e.currentTarget.style.boxShadow='none' }}
              >
                {nameSaving ? 'Зберігаємо...' : 'Зберегти'}
              </button>
            </div>

            <div style={{ marginTop:'16px' }}>
              <label style={lbl}>Email</label>
              <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'8px', fontSize:'14px', color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:'8px' }}>
                <Mail size={13} style={{color:'rgba(255,255,255,0.2)'}}/>
                {profile?.email}
                <span style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>не змінюється</span>
              </div>
            </div>
          </div>

          {/* Зміна пароля */}
          <div className="anim-up-3" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(230,0,0,0.08)', border:'1px solid rgba(230,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Lock size={15} style={{color:'#e60000'}}/>
              </div>
              <div>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>Зміна пароля</p>
                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>Рекомендуємо використовувати надійний пароль</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column' as const, gap:'14px' }}>
              {/* Поточний пароль */}
              <div>
                <label style={lbl}>Поточний пароль</label>
                <div style={{ position:'relative' }}>
                  <input type={showCurrent?'text':'password'} value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} placeholder="Введіть поточний пароль"
                    style={{ ...inp(focusedField==='current'), paddingRight:'44px' }}
                    onFocus={()=>setFocusedField('current')} onBlur={()=>setFocusedField(null)}
                  />
                  <button type="button" onClick={()=>setShowCurrent(!showCurrent)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'4px' }}>
                    {showCurrent ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* Новий пароль */}
              <div>
                <label style={lbl}>Новий пароль</label>
                <div style={{ position:'relative' }}>
                  <input type={showNew?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Мінімум 8 символів"
                    style={{ ...inp(focusedField==='new'), paddingRight:'44px' }}
                    onFocus={()=>setFocusedField('new')} onBlur={()=>setFocusedField(null)}
                  />
                  <button type="button" onClick={()=>setShowNew(!showNew)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'4px' }}>
                    {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {/* Індикатор сили пароля */}
                {newPwd && strength && (
                  <div style={{ marginTop:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>Надійність пароля</span>
                      <span style={{ fontSize:'11px', fontWeight:600, color:strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:strength.w, background:strength.color, borderRadius:'2px', transition:'width 0.3s, background 0.3s' }}/>
                    </div>
                  </div>
                )}
              </div>

              {/* Підтвердження */}
              <div>
                <label style={lbl}>Підтвердіть пароль</label>
                <div style={{ position:'relative' }}>
                  <input type={showConfirm?'text':'password'} value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} placeholder="Повторіть новий пароль"
                    style={{ ...inp(focusedField==='confirm'), paddingRight:'44px', borderColor: confirmPwd && confirmPwd!==newPwd ? '#ff4444' : focusedField==='confirm' ? '#e60000' : 'rgba(255,255,255,0.07)' }}
                    onFocus={()=>setFocusedField('confirm')} onBlur={()=>setFocusedField(null)}
                  />
                  <button type="button" onClick={()=>setShowConfirm(!showConfirm)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', padding:'4px' }}>
                    {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {confirmPwd && confirmPwd !== newPwd && (
                  <p style={{ fontSize:'11px', color:'#ff4444', marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                    <AlertCircle size={11}/>Паролі не співпадають
                  </p>
                )}
                {confirmPwd && confirmPwd === newPwd && (
                  <p style={{ fontSize:'11px', color:'#00c864', marginTop:'6px', display:'flex', alignItems:'center', gap:'4px' }}>
                    <CheckCircle size={11}/>Паролі співпадають
                  </p>
                )}
              </div>

              <button onClick={handlePwdSave} disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd || newPwd!==confirmPwd}
                style={{ width:'100%', padding:'13px', background: (pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd) ? 'rgba(230,0,0,0.3)' : '#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor:(pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.15s', marginTop:'4px' }}
                onMouseEnter={e=>{ if(!pwdSaving&&currentPwd&&newPwd&&confirmPwd&&newPwd===confirmPwd){e.currentTarget.style.background='#cc0000';e.currentTarget.style.boxShadow='0 4px 20px rgba(230,0,0,0.35)';e.currentTarget.style.transform='translateY(-1px)'}}}
                onMouseLeave={e=>{ e.currentTarget.style.background=(pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd)?'rgba(230,0,0,0.3)':'#e60000';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none' }}
              >
                {pwdSaving
                  ? <><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Змінюємо...</>
                  : <><Lock size={15}/>Змінити пароль</>
                }
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
