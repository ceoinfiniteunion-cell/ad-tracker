'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { User, Lock, Mail, Building2, Calendar, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
const gridBg = { position:'fixed' as const, inset:0,  pointerEvents:'none' as const, zIndex:0 }
const inp = (focused: boolean) => ({ width:'100%', padding:'12px 16px', background:'var(--bg3)', border:`1px solid ${focused ? '#e60000' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', color:'var(--text)', fontSize:'14px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s, box-shadow 0.2s', boxShadow: focused ? '0 0 0 3px rgba(230,0,0,0.12)' : 'none' })
const lbl = { display:'block', fontSize:'10px', fontWeight:600 as const, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--text3)', marginBottom:'8px' }
interface Profile { name: string; email: string; createdAt: string }
export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [isMobile, setIsMobile] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null)
  const [name, setName] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name:'', email:'', password:'' })
  const [addingAdmin, setAddingAdmin] = useState(false)
  const [adminMsg, setAdminMsg] = useState<{text:string;ok:boolean}|null>(null)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [twoFAMsg, setTwoFAMsg] = useState<{text:string;ok:boolean}|null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/profile').then(r=>r.json()).then(d=>{ setProfile(d); setName(d.name||''); setLoading(false) })
    fetch('/api/auth/2fa/status').then(r=>r.json()).then(d=>{ setTwoFAEnabled(d.twoFactorEnabled) })
  }, [])

  const showToast = (msg: string, ok: boolean) => { setToast({msg,ok}); setTimeout(()=>setToast(null), 3500) }

  const saveName = async () => {
    if (!name.trim() || name === profile?.name) return
    setNameSaving(true)
    const res = await fetch('/api/profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) })
    if (res.ok) { setProfile(p=>p?{...p,name}:p); await updateSession(); showToast("Ім`я оновлено", true) }
    else showToast('Помилка збереження', false)
    setNameSaving(false)
  }

  const changePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { showToast('Заповніть всі поля', false); return }
    if (newPwd !== confirmPwd) { showToast('Паролі не співпадають', false); return }
    if (newPwd.length < 8) { showToast('Пароль мінімум 8 символів', false); return }
    setPwdSaving(true)
    const res = await fetch('/api/profile', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({currentPassword:currentPwd, newPassword:newPwd}) })
    const data = await res.json()
    if (res.ok) { showToast('Пароль змінено', true); setCurrentPwd(''); setNewPwd(''); setConfirmPwd('') }
    else showToast(data.error||'Помилка', false)
    setPwdSaving(false)
  }

  const confirm2FA = async () => {
    if (verifyCode.length !== 6) return
    setVerifying(true)
    const verRes = await fetch('/api/auth/2fa/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email: profile?.email, code: verifyCode }) })
    const verData = await verRes.json()
    if (verData.ok) {
      const res = await fetch('/api/auth/2fa/toggle', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ enabled: true }) })
      if (res.ok) { setTwoFAEnabled(true); setShowVerifyForm(false); setVerifyCode(''); setTwoFAMsg({ text: '✓ Двофакторна автентифікація увімкнена', ok: true }) }
    } else {
      setTwoFAMsg({ text: verData.error || 'Невірний код', ok: false })
    }
    setVerifying(false)
  }

  const toggle2FA = async () => {
    if (!twoFAEnabled) {
      // Увімкнення — спочатку відправляємо код
      setTwoFALoading(true); setTwoFAMsg(null)
      const res = await fetch('/api/auth/2fa/send', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ email: session?.user?.email || profile?.email })
      })
      setTwoFALoading(false)
      if (res.ok) {
        setShowVerifyForm(true)
        setTwoFAMsg({ text: 'Код відправлено на ' + profile?.email + '. Введіть його нижче.', ok: true })
      } else {
        setTwoFAMsg({ text: 'Помилка відправки коду', ok: false })
      }
    } else {
      // Вимкнення
      setTwoFALoading(true); setTwoFAMsg(null)
      const res = await fetch('/api/auth/2fa/toggle', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ enabled: false })
      })
      if (res.ok) { setTwoFAEnabled(false); setShowVerifyForm(false); setTwoFAMsg({ text: '✓ Двофакторна автентифікація вимкнена', ok: true }) }
      else setTwoFAMsg({ text: 'Помилка', ok: false })
      setTwoFALoading(false)
    }
  }

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) { setAdminMsg({text:'Заповніть всі поля',ok:false}); return }
    if (newAdmin.password.length < 8) { setAdminMsg({text:'Пароль мінімум 8 символів',ok:false}); return }
    setAddingAdmin(true); setAdminMsg(null)
    const res = await fetch('/api/admin/create-admin', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newAdmin) })
    const data = await res.json()
    if (res.ok) { setAdminMsg({text:'Адміна ' + data.email + ' створено',ok:true}); setNewAdmin({name:'',email:'',password:''}) }
    else setAdminMsg({text:data.error||'Помилка',ok:false})
    setAddingAdmin(false)
  }

  const pad = isMobile ? '16px 16px 80px' : '36px 40px'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={gridBg}/>
        {toast && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:100, display:'flex', alignItems:'center', gap:'10px', padding:'14px 20px', borderRadius:'10px', fontSize:'13px', fontWeight:600, background: toast.ok?'rgba(0,200,100,0.12)':'rgba(230,0,0,0.12)', border:`1px solid ${toast.ok?'rgba(0,200,100,0.25)':'rgba(230,0,0,0.25)'}`, color: toast.ok?'#00c864':'#ff6b6b', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', animation:'slideUp 0.3s ease' }}>
            {toast.ok ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}{toast.msg}
          </div>
        )}

        <div style={{ maxWidth:'680px', margin:'0 auto', padding:pad, position:'relative', zIndex:1 }}>
          <div className="anim-fade" style={{ marginBottom: isMobile ? '20px' : '32px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// ПРОФІЛЬ</p>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Налаштування акаунту</h1>
            <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Керуйте своїми даними та безпекою</p>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
            </div>
          ) : (
            <>
              {/* Профіль картка */}
              <div className="anim-up-1" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '16px' : '24px', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(230,0,0,0.12)', border:'2px solid rgba(230,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:800, color:'#e60000', flexShrink:0 }}>
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p style={{ fontSize:'17px', fontWeight:800, color:'var(--text)', margin:0 }}>{profile?.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                      <Mail size={12} style={{color:'var(--text3)'}}/>
                      <span style={{ fontSize:'12px', color:'var(--text3)' }}>{profile?.email}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'3px' }}>
                      <Calendar size={12} style={{color:'var(--text3)'}}/>
                      <span style={{ fontSize:'12px', color:'var(--text3)' }}>з {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('uk',{day:'numeric',month:'long',year:'numeric'}) : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Особисті дані */}
              <div className="anim-up-2" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                  <User size={15} style={{color:'var(--text3)'}}/>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>Особисті дані</p>
                  <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Оновіть своє імʼя</p>
                </div>
                <div style={{ padding: isMobile ? '16px' : '20px' }}>
                  <div style={{ marginBottom:'14px' }}>
                    <label style={lbl}>ІМʼЯ</label>
                    <div style={{ display:'flex', gap:'10px' }}>
                      <input value={name} onChange={e=>setName(e.target.value)} onFocus={()=>setNameFocused(true)} onBlur={()=>setNameFocused(false)} placeholder="Ваше імʼя" style={inp(nameFocused)}/>
                      <button onClick={saveName} disabled={nameSaving||!name.trim()||name===profile?.name}
                        style={{ padding:'0 20px', background: (nameSaving||!name.trim()||name===profile?.name)?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', fontWeight:700, fontSize:'13px', borderRadius:'8px', border:'none', cursor:(nameSaving||!name.trim()||name===profile?.name)?'not-allowed':'pointer', whiteSpace:'nowrap' as const, flexShrink:0 }}>
                        {nameSaving ? '...' : 'Зберегти'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>EMAIL</label>
                    <input value={profile?.email||''} disabled style={{ ...inp(false), opacity:0.5, cursor:'not-allowed' }}/>
                    <p style={{ fontSize:'11px', color:'var(--text4)', marginTop:'6px' }}>Email не можна змінити. Зверніться до адміністратора.</p>
                  </div>
                </div>
              </div>

              {/* Зміна пароля */}
              <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                  <Lock size={15} style={{color:'var(--text3)'}}/>
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>Зміна пароля</p>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Рекомендуємо використовувати надійний пароль</p>
                  </div>
                </div>
                <div style={{ padding: isMobile ? '16px' : '20px', display:'flex', flexDirection:'column', gap:'14px' }}>
                  {[
                    { label:'ПОТОЧНИЙ ПАРОЛЬ', val:currentPwd, set:setCurrentPwd, show:showCurrent, setShow:setShowCurrent },
                    { label:'НОВИЙ ПАРОЛЬ', val:newPwd, set:setNewPwd, show:showNew, setShow:setShowNew },
                    { label:'ПІДТВЕРДІТЬ ПАРОЛЬ', val:confirmPwd, set:setConfirmPwd, show:showConfirm, setShow:setShowConfirm },
                  ].map(f=>(
                    <div key={f.label}>
                      <label style={lbl}>{f.label}</label>
                      <div style={{ position:'relative' }}>
                        <input type={f.show?'text':'password'} value={f.val} onChange={e=>f.set(e.target.value)} style={{ ...inp(false), paddingRight:'44px' }}/>
                        <button onClick={()=>f.setShow(!f.show)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'4px', display:'flex' }}>
                          {f.show ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                  {newPwd && confirmPwd && newPwd !== confirmPwd && (
                    <p style={{ fontSize:'12px', color:'#ff4444', margin:0, display:'flex', alignItems:'center', gap:'6px' }}>
                      <AlertCircle size={13}/>Паролі не співпадають
                    </p>
                  )}
                  <button onClick={changePassword} disabled={pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd}
                    style={{ padding:'12px', background:(pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd)?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', fontWeight:700, fontSize:'13px', borderRadius:'8px', border:'none', cursor:(pwdSaving||!currentPwd||!newPwd||!confirmPwd||newPwd!==confirmPwd)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    {pwdSaving ? <><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Змінюємо...</> : <><Lock size={15}/>Змінити пароль</>}
                  </button>
                </div>
              </div>

              {/* 2FA секція */}
              <div className="anim-up-4" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>Двофакторна автентифікація</p>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Захист акаунту через email-код</p>
                  </div>
                </div>
                <div style={{ padding: isMobile ? '16px' : '20px' }}>
                  <p style={{ fontSize:'13px', color:'var(--text3)', margin:'0 0 16px', lineHeight:1.6 }}>
                    При увімкненій 2FA кожного разу при вході на вашу пошту буде надходити 6-значний код підтвердження. Це захищає акаунт навіть якщо хтось дізнається ваш пароль.
                  </p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--bg3)', borderRadius:'10px', marginBottom:'12px' }}>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', margin:0 }}>
                        {twoFAEnabled ? '🔒 Увімкнено' : '🔓 Вимкнено'}
                      </p>
                      <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>
                        {twoFAEnabled ? 'Код надходить на ' + profile?.email : 'Додатковий захист вимкнено'}
                      </p>
                    </div>
                    <button onClick={toggle2FA} disabled={twoFALoading}
                      style={{ padding:'8px 16px', background: twoFAEnabled ? 'rgba(255,68,68,0.12)' : 'rgba(0,200,100,0.12)', color: twoFAEnabled ? '#ff4444' : '#00c864', border:`1px solid ${twoFAEnabled ? 'rgba(255,68,68,0.25)' : 'rgba(0,200,100,0.25)'}`, borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor: twoFALoading ? 'not-allowed' : 'pointer' }}>
                      {twoFALoading ? '...' : twoFAEnabled ? 'Вимкнути' : 'Увімкнути'}
                    </button>
                  </div>
                  {showVerifyForm && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'14px', background:'var(--bg3)', borderRadius:'10px', border:'1px solid var(--border)' }}>
                      <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Введіть 6-значний код з листа для підтвердження</p>
                      <input value={verifyCode} onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" maxLength={6}
                        style={{ padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'20px', fontWeight:800, letterSpacing:'8px', fontFamily:'monospace', textAlign:'center', outline:'none' }}/>
                      <button onClick={confirm2FA} disabled={verifying||verifyCode.length!==6}
                        style={{ padding:'10px', background:(verifying||verifyCode.length!==6)?'rgba(0,200,100,0.3)':'#00c864', color:'#fff', fontWeight:700, fontSize:'13px', borderRadius:'8px', border:'none', cursor:(verifying||verifyCode.length!==6)?'not-allowed':'pointer' }}>
                        {verifying ? 'Перевіряємо...' : '✓ Підтвердити і увімкнути'}
                      </button>
                    </div>
                  )}
                  {twoFAMsg && (
                    <div style={{ padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background: twoFAMsg.ok ? 'rgba(0,200,100,0.1)' : 'rgba(230,0,0,0.1)', border:`1px solid ${twoFAMsg.ok ? 'rgba(0,200,100,0.2)' : 'rgba(230,0,0,0.2)'}`, color: twoFAMsg.ok ? '#00c864' : '#ff6b6b' }}>
                      {twoFAMsg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Додати адміна - тільки для ADMIN */}
              {isAdmin && (
                <div className="anim-up-4" style={{ background:'var(--bg2)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'10px', background:'rgba(230,0,0,0.04)' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'rgba(230,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e60000" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>Додати адміністратора</p>
                      <p style={{ fontSize:'11px', color:'var(--text3)', margin:0 }}>Повний доступ до системи</p>
                    </div>
                  </div>
                  <div style={{ padding: isMobile ? '16px' : '20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0, lineHeight:1.5 }}>
                      Новий адмін матиме повний доступ до всіх клієнтів, статистики та налаштувань. Використовуйте тільки для довірених осіб.
                    </p>
                    <div>
                      <label style={lbl}>ІМʼЯ</label>
                      <input value={newAdmin.name} onChange={e=>setNewAdmin({...newAdmin,name:e.target.value})} placeholder="Іван Петренко" style={inp(false)}/>
                    </div>
                    <div>
                      <label style={lbl}>EMAIL</label>
                      <input type="email" value={newAdmin.email} onChange={e=>setNewAdmin({...newAdmin,email:e.target.value})} placeholder="admin@company.com" style={inp(false)}/>
                    </div>
                    <div>
                      <label style={lbl}>ПАРОЛЬ</label>
                      <input type="password" value={newAdmin.password} onChange={e=>setNewAdmin({...newAdmin,password:e.target.value})} placeholder="Мінімум 8 символів" style={inp(false)}/>
                    </div>
                    {adminMsg && (
                      <div style={{ padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background: adminMsg.ok?'rgba(0,200,100,0.1)':'rgba(230,0,0,0.1)', border:`1px solid ${adminMsg.ok?'rgba(0,200,100,0.2)':'rgba(230,0,0,0.2)'}`, color: adminMsg.ok?'#00c864':'#ff6b6b' }}>
                        {adminMsg.text}
                      </div>
                    )}
                    <button onClick={createAdmin} disabled={addingAdmin}
                      style={{ padding:'12px', background: addingAdmin?'rgba(230,0,0,0.3)':'#e60000', color:'#fff', fontWeight:700, fontSize:'13px', borderRadius:'8px', border:'none', cursor: addingAdmin?'not-allowed':'pointer' }}>
                      {addingAdmin ? 'Створення...' : '+ Створити адміністратора'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
