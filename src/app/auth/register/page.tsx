'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Помилка'); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Помилка сервера')
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,0,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="anim-up" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="anim-float" style={{ display: 'inline-block', marginBottom: '16px' }}>
            <svg width="64" height="32" viewBox="0 0 64 32">
              <ellipse cx="20" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
              <ellipse cx="44" cy="16" rx="12" ry="10" fill="none" stroke="#e60000" strokeWidth="2.5" opacity="0.9"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text3)', marginBottom: '8px' }}>INFINITE UNION</div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Ad Tracker</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>Створити акаунт</p>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', boxShadow: '0 0 60px rgba(230,0,0,0.08)' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={48} style={{ color: '#22c55e', margin: '0 auto 16px', display: 'block' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>Заявку надіслано!</h2>
              <p style={{ fontSize: '14px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '24px' }}>Ваш акаунт на розгляді. Ми повідомимо вас коли доступ буде активовано.</p>
              <button onClick={() => router.push('/auth/login')} style={{ width: '100%', padding: '12px', background: '#e60000', color: 'var(--text)', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Повернутись до входу</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {[
                { key: 'name', label: "Ім&apos;я та прізвище *", placeholder: 'Іван Петренко', type: 'text' },
                { key: 'email', label: 'Email *', placeholder: 'your@email.com', type: 'email' },
                { key: 'password', label: 'Пароль *', placeholder: '••••••••', type: 'password' },
                { key: 'company', label: 'Компанія', placeholder: 'Назва компанії', type: 'text' },
                { key: 'phone', label: 'Телефон', placeholder: '+380 XX XXX XX XX', type: 'text' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '8px' }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={set(field.key)} required={field.label.includes('*')} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#e60000'; e.target.style.boxShadow = '0 0 0 3px rgba(230,0,0,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              ))}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(230,0,0,0.1)', border: '1px solid rgba(230,0,0,0.25)', borderRadius: '8px', color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
                </div>
              )}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', background: loading ? '#555' : '#e60000', color: 'var(--text)', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget).style.background = '#cc0000' } }}
                onMouseLeave={e => { (e.currentTarget).style.background = '#e60000' }}
              >
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Надсилаємо...</> : 'Подати заявку →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)', marginTop: '20px', marginBottom: 0 }}>
                Вже є акаунт?{' '}<a href="/auth/login" style={{ color: '#e60000', textDecoration: 'none', fontWeight: 600 }}>Увійти</a>
              </p>
            </form>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', marginTop: '24px' }}>© 2026 · Infinite Union · All rights reserved</p>
      </div>
    </div>
  )
}
