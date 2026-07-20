'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Platform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK'
interface AdAccountForm { name: string; accountId: string; platform: Platform }

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' })
  const [adAccounts, setAdAccounts] = useState<AdAccountForm[]>([{ name: '', accountId: '', platform: 'FACEBOOK' }])

  const addAccount = () => setAdAccounts([...adAccounts, { name: '', accountId: '', platform: 'FACEBOOK' }])
  const removeAccount = (i: number) => setAdAccounts(adAccounts.filter((_, idx) => idx !== i))
  const updateAccount = (i: number, field: keyof AdAccountForm, value: string) => {
    const updated = [...adAccounts]; updated[i] = { ...updated[i], [field]: value }; setAdAccounts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, adAccounts }) })
    if (res.ok) router.push('/admin/clients')
    else { const d = await res.json(); setError(d.error ?? 'Помилка при створенні'); setLoading(false) }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-2xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <Link href="/admin/clients" className="flex items-center gap-2 text-xs mb-5 transition-colors" style={{color:'rgba(255,255,255,0.35)'}}>
              <ArrowLeft className="w-3.5 h-3.5" />Назад до клієнтів
            </Link>
            <p className="mono text-xs mb-2" style={{color:'rgba(255,255,255,0.3)'}}>// НОВИЙ КЛІЄНТ</p>
            <h1 className="text-2xl font-bold text-white">Додати клієнта</h1>
            <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.4)'}}>Заповніть дані та прив'яжіть рекламні кабінети</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up stagger-1">
            {/* Основна інформація */}
            <div className="iu-card p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.4)'}}>Основна інформація</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="iu-label">Ім'я</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Іван Петренко" required className="iu-input" /></div>
                <div><label className="iu-label">Компанія</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="ТОВ Компанія" required className="iu-input" /></div>
              </div>
              <div><label className="iu-label">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@company.com" required className="iu-input" /></div>
              <div><label className="iu-label">Пароль</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Мінімум 8 символів" required minLength={8} className="iu-input" /></div>
            </div>

            {/* Рекламні кабінети */}
            <div className="iu-card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.4)'}}>Рекламні кабінети</p>
                <button type="button" onClick={addAccount} className="iu-btn-ghost text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5" />Додати</button>
              </div>
              <div className="space-y-3">
                {adAccounts.map((acc, i) => (
                  <div key={i} className="grid gap-3 items-end" style={{gridTemplateColumns:'1fr 1fr 1fr auto'}}>
                    <div>
                      <label className="iu-label">Платформа</label>
                      <select value={acc.platform} onChange={e=>updateAccount(i,'platform',e.target.value)} className="iu-input">
                        <option value="FACEBOOK">Facebook / Meta</option>
                        <option value="GOOGLE">Google Ads</option>
                        <option value="TIKTOK">TikTok Ads</option>
                      </select>
                    </div>
                    <div>
                      <label className="iu-label">ID кабінету</label>
                      <input value={acc.accountId} onChange={e=>updateAccount(i,'accountId',e.target.value)} placeholder="act_123456" required className="iu-input" />
                    </div>
                    <div>
                      <label className="iu-label">Назва</label>
                      <input value={acc.name} onChange={e=>updateAccount(i,'name',e.target.value)} placeholder="Основний" required className="iu-input" />
                    </div>
                    <button type="button" onClick={()=>removeAccount(i)} disabled={adAccounts.length===1} className="p-2.5 rounded-lg transition-colors disabled:opacity-20" style={{color:'rgba(255,255,255,0.3)'}}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg" style={{background:'rgba(230,0,0,0.1)',border:'1px solid rgba(230,0,0,0.2)',color:'#ff6b6b'}}>
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading} className="iu-btn w-full">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Створюємо...</> : 'Створити клієнта →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
