'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials'|'2fa'>('credentials')
  const [code, setCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeError, setCodeError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    // Перевіряємо чи потрібен 2FA
    const checkRes = await fetch('/api/auth/2fa/status-by-email', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    })
    const checkData = await checkRes.json()

    if (checkData.requires2FA) {
      // Відправляємо код
      setSendingCode(true)
      await fetch('/api/auth/2fa/send', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email })
      })
      setSendingCode(false)
      setStep('2fa')
      setLoading(false)
      return
    }

    if (checkData.error) {
      setError(checkData.error)
      setLoading(false)
      return
    }

    // Звичайний вхід без 2FA
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      if (result.error.includes('заблоковано')) setError(result.error)
      else if (result.error.includes('підтвердження')) setError('Ваша заявка ще на розгляді.')
      else if (result.error.includes('відхилено')) setError('Ваш акаунт відхилено.')
      else setError('Невірний email або пароль')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setCodeError('')

    const verifyRes = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, code })
    })
    const verifyData = await verifyRes.json()

    if (!verifyData.ok) {
      setCodeError(verifyData.error || 'Невірний код')
      setLoading(false)
      return
    }

    // Код вірний — входимо
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      setStep('credentials')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inp = { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'var(--text)', fontSize:'15px', outline:'none', boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'56px', height:'56px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'14px', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
            <svg width="28" height="14" viewBox="0 0 44 22">
              <ellipse cx="11" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
              <ellipse cx="33" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text)', margin:0 }}>Ad Tracker</h1>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>by Infinite Union</p>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'28px' }}>
          {step === 'credentials' ? (
            <>
              <h2 style={{ fontSize:'18px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>Вхід в систему</h2>
              <p style={{ fontSize:'13px', color:'var(--text3)', margin:'0 0 24px' }}>Введіть ваші дані для входу</p>

              <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'var(--text3)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required style={inp}
                    onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'var(--text3)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Пароль</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inp, paddingRight:'44px' }}
                      onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                      onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
                    />
                    <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'4px', display:'flex' }}>
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px' }}>
                    <AlertCircle size={14} style={{flexShrink:0}}/>{error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ padding:'13px', background: loading?'rgba(230,0,0,0.5)':'#e60000', color:'#fff', fontWeight:700, fontSize:'15px', borderRadius:'10px', border:'none', cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'4px' }}>
                  {loading ? <><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/>Входимо...</> : 'Увійти'}
                </button>
              </form>

              <div style={{ textAlign:'center', marginTop:'20px' }}>
                <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>
                  Немає акаунту?{' '}
                  <Link href="/auth/register" style={{ color:'#e60000', textDecoration:'none', fontWeight:600 }}>Зареєструватись</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <div style={{ width:'48px', height:'48px', background:'rgba(230,0,0,0.12)', borderRadius:'12px', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                  <Shield size={22} style={{color:'#e60000'}}/>
                </div>
                <h2 style={{ fontSize:'18px', fontWeight:700, color:'var(--text)', margin:'0 0 6px' }}>Підтвердження входу</h2>
                <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Код відправлено на <strong style={{color:'var(--text)'}}>{email}</strong></p>
              </div>

              <form onSubmit={handleVerify2FA} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'var(--text3)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.08em' }}>6-значний код</label>
                  <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" maxLength={6} required style={{ ...inp, textAlign:'center', fontSize:'28px', fontWeight:800, letterSpacing:'8px', fontFamily:'monospace' }}
                    onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none'}}
                  />
                </div>

                {codeError && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px' }}>
                    <AlertCircle size={14} style={{flexShrink:0}}/>{codeError}
                  </div>
                )}

                <button type="submit" disabled={loading||code.length!==6} style={{ padding:'13px', background:(loading||code.length!==6)?'rgba(230,0,0,0.4)':'#e60000', color:'#fff', fontWeight:700, fontSize:'15px', borderRadius:'10px', border:'none', cursor:(loading||code.length!==6)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  {loading ? <><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/>Перевіряємо...</> : 'Підтвердити'}
                </button>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <button type="button" onClick={()=>setStep('credentials')} style={{ background:'none', border:'none', color:'var(--text3)', fontSize:'13px', cursor:'pointer' }}>
                    ← Назад
                  </button>
                  <button type="button" onClick={async()=>{ setSendingCode(true); await fetch('/api/auth/2fa/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); setSendingCode(false) }} disabled={sendingCode} style={{ background:'none', border:'none', color:'#e60000', fontSize:'13px', cursor:'pointer', fontWeight:600 }}>
                    {sendingCode ? 'Відправляємо...' : 'Відправити знову'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
