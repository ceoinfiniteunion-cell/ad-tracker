'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    if (rememberMe) { localStorage.setItem('remembered_email', email) } else { localStorage.removeItem('remembered_email') }
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      if (result.error.includes('заблоковано') || result.error.includes('blocked')) { setError(result.error) }
      else if (result.error.includes('підтвердження') || result.error.includes('PENDING')) { setError('Ваша заявка ще на розгляді. Очікуйте підтвердження від адміністратора.') }
      else if (result.error.includes('REJECTED')) { setError('Ваш акаунт відхилено. Зверніться до підтримки.') }
      else { setError('Невірний email або пароль') }
      setLoading(false)
    } else { router.push('/'); router.refresh() }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(230,0,0,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.07 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M-100,450 C100,200 300,700 500,450 C700,200 900,700 1100,450 C1300,200 1500,700 1700,450" fill="none" stroke="#e60000" strokeWidth="2" strokeDasharray="12 8" style={{ animation:'snake 8s linear infinite' }} />
        <path d="M-100,350 C150,100 350,600 550,350 C750,100 950,600 1150,350 C1350,100 1550,600 1750,350" fill="none" stroke="#e60000" strokeWidth="1" strokeDasharray="8 12" style={{ animation:'snake 12s linear infinite reverse' }} />
      </svg>
      <div className="anim-up" style={{ width:'100%', maxWidth:'380px', position:'relative', zIndex:10 }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div className="anim-float" style={{ display:'inline-block', marginBottom:'20px' }}>
            <svg width="64" height="32" viewBox="0 0 64 32">
              <ellipse cx="20" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
              <ellipse cx="44" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
            </svg>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'var(--text3)', marginBottom:'8px' }}>INFINITE UNION</div>
          <h1 style={{ fontSize:'26px', fontWeight:800, color:'var(--text)', margin:0 }}>Ad Tracker</h1>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Аналітика рекламних кампаній</p>
        </div>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'32px', boxShadow:'0 0 60px rgba(230,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'8px' }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required
                style={{ width:'100%', padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' }}
                onFocus={e=>{ e.target.style.borderColor='#e60000'; e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.15)' }}
                onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.boxShadow='none' }}
              />
            </div>
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'8px' }}>Пароль</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width:'100%', padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' }}
                onFocus={e=>{ e.target.style.borderColor='#e60000'; e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.15)' }}
                onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.boxShadow='none' }}
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px', cursor:'pointer' }} onClick={()=>setRememberMe(!rememberMe)}>
              <div style={{ width:'18px', height:'18px', borderRadius:'4px', flexShrink:0, border: rememberMe ? '2px solid #e60000' : '2px solid rgba(255,255,255,0.2)', background: rememberMe ? '#e60000' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span style={{ fontSize:'13px', color:'var(--text3)', userSelect:'none' }}>Запам'ятати мене</span>
            </div>
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px', marginBottom:'16px' }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} />{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px', background: loading ? '#555' : '#e60000', color:'var(--text)', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}
              onMouseEnter={e=>{ if (!loading) { (e.target as HTMLElement).style.background='#cc0000'; (e.target as HTMLElement).style.boxShadow='0 4px 24px rgba(230,0,0,0.4)'; (e.target as HTMLElement).style.transform='translateY(-1px)' }}}
              onMouseLeave={e=>{ (e.target as HTMLElement).style.background='#e60000'; (e.target as HTMLElement).style.boxShadow='none'; (e.target as HTMLElement).style.transform='none' }}
            >
              {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />Входимо...</> : 'Увійти →'}
            </button>
          </form>
          <p style={{ textAlign:'center', fontSize:'13px', color:'var(--text3)', marginTop:'20px', marginBottom:0 }}>
            Ще немає акаунту?{' '}<a href="/auth/register" style={{ color:'#e60000', textDecoration:'none', fontWeight:600 }}>Подати заявку</a>
          </p>
        </div>
        <p style={{ textAlign:'center', fontSize:'11px', fontFamily:'monospace', color:'rgba(255,255,255,0.18)', marginTop:'24px' }}>© 2026 · Infinite Union · All rights reserved</p>
      </div>
    </div>
  )
}
