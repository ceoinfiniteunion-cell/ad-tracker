'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, BarChart3, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { setError('Невірний email або пароль'); setLoading(false) }
    else { router.push('/'); router.refresh() }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Червоне світло фон */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(230,0,0,0.08) 0%, transparent 70%)'}} />

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Логотип */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5" style={{background:'rgba(230,0,0,0.1)',border:'1px solid rgba(230,0,0,0.3)'}}>
            <BarChart3 className="w-7 h-7" style={{color:'#e60000'}} />
          </div>
          <div className="mono text-xs tracking-widest mb-2" style={{color:'rgba(255,255,255,0.3)'}}>INFINITE UNION</div>
          <h1 className="text-2xl font-bold text-white">Ad Tracker</h1>
          <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.4)'}}>Аналітика рекламних кампаній</p>
        </div>

        {/* Форма */}
        <div className="iu-card p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="iu-label">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required className="iu-input" />
            </div>
            <div>
              <label className="iu-label">Пароль</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required className="iu-input" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{background:'rgba(230,0,0,0.1)',border:'1px solid rgba(230,0,0,0.2)',color:'#ff6b6b'}}>
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <button type="submit" disabled={loading} className="iu-btn w-full mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Входимо...</> : 'Увійти →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 mono" style={{color:'rgba(255,255,255,0.2)'}}>© 2026 · Infinite Union · Ad Tracker</p>
      </div>
    </div>
  )
}
