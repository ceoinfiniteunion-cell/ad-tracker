'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { setError('Невірний email або пароль'); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden' }}>

      {/* Сітка фон */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' }} />

      {/* Червоне світіння */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(230,0,0,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* Змія SVG фон */}
      <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.07 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M-100,450 C100,200 300,700 500,450 C700,200 900,700 1100,450 C1300,200 1500,700 1700,450" fill="none" stroke="#e60000" strokeWidth="2" strokeDasharray="12 8" style={{ animation:'snake 8s linear infinite' }} />
        <path d="M-100,350 C150,100 350,600 550,350 C750,100 950,600 1150,350 C1350,100 1550,600 1750,350" fill="none" stroke="#e60000" strokeWidth="1" strokeDasharray="8 12" style={{ animation:'snake 12s linear infinite reverse' }} />
      </svg>

      <div className="anim-up" style={{ width:'100%', maxWidth:'380px', position:'relative', zIndex:10 }}>

        {/* Логотип */}
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          {/* Знак нескінченності */}
          <div className="anim-float" style={{ display:'inline-block', marginBottom:'20px' }}>
            <svg width="64" height="32" viewBox="0 0 64 32">
              <path d="M20,16 C20,9 25,4 32,4 C39,4 44,9 44,16 C44,23 39,28 32,28 C25,28 20,23 20,16 Z M32,16 C32,9 37,4 44,4 C51,4 56,9 56,16 C56,23 51,28 44,28" fill="none" stroke="#e60000" strokeWidth="3" strokeLinecap="round"/>
              <ellipse cx="20" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
              <ellipse cx="44" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
            </svg>
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>INFINITE UNION</div>
          <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Ad Tracker</h1>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Аналітика рекламних кампаній</p>
        </div>

        {/* Картка форми */}
        <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'32px', boxShadow:'0 0 60px rgba(230,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'8px' }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required
                style={{ width:'100%', padding:'12px 16px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' }}
                onFocus={e=>{ e.target.style.borderColor='#e60000'; e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.15)' }}
                onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.boxShadow='none' }}
              />
            </div>
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:'8px' }}>Пароль</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width:'100%', padding:'12px 16px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box' }}
                onFocus={e=>{ e.target.style.borderColor='#e60000'; e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.15)' }}
                onBlur={e=>{ e.target.style.borderColor='rgba(255,255,255,0.07)'; e.target.style.boxShadow='none' }}
              />
            </div>
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px', marginBottom:'16px' }}>
                <AlertCircle size={15} style={{ flexShrink:0 }} />{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px', background: loading ? '#555' : '#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', letterSpacing:'0.02em' }}
              onMouseEnter={e=>{ if (!loading) { (e.target as HTMLElement).style.background='#cc0000'; (e.target as HTMLElement).style.boxShadow='0 4px 24px rgba(230,0,0,0.4)'; (e.target as HTMLElement).style.transform='translateY(-1px)' }}}
              onMouseLeave={e=>{ (e.target as HTMLElement).style.background='#e60000'; (e.target as HTMLElement).style.boxShadow='none'; (e.target as HTMLElement).style.transform='none' }}
            >
              {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} />Входимо...</> : 'Увійти →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:'11px', fontFamily:'monospace', color:'rgba(255,255,255,0.18)', marginTop:'24px' }}>© 2026 · Infinite Union · All rights reserved</p>
      </div>
    </div>
  )
}
