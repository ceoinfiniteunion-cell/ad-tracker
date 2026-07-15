'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Platform = 'FACEBOOK' | 'GOOGLE' | 'TIKTOK'

interface AdAccountForm {
  name: string
  accountId: string
  platform: Platform
}

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
  })
  const [adAccounts, setAdAccounts] = useState<AdAccountForm[]>([
    { name: '', accountId: '', platform: 'FACEBOOK' },
  ])

  const addAccount = () => {
    setAdAccounts([...adAccounts, { name: '', accountId: '', platform: 'FACEBOOK' }])
  }

  const removeAccount = (i: number) => {
    setAdAccounts(adAccounts.filter((_, idx) => idx !== i))
  }

  const updateAccount = (i: number, field: keyof AdAccountForm, value: string) => {
    const updated = [...adAccounts]
    updated[i] = { ...updated[i], [field]: value }
    setAdAccounts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, adAccounts }),
    })

    if (res.ok) {
      router.push('/admin/clients')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Помилка при створенні клієнта')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/admin/clients"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад до клієнтів
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Новий клієнт</h1>
            <p className="text-gray-500 mt-1">Заповніть дані та прив'яжіть рекламні кабінети</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Основна інформація</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ім'я клієнта</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Іван Петренко"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Компанія</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="ТОВ Компанія"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email для входу</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="client@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Мінімум 8 символів"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            {/* Ad Accounts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Рекламні кабінети</h2>
                <button
                  type="button"
                  onClick={addAccount}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Додати
                </button>
              </div>

              <div className="space-y-4">
                {adAccounts.map((acc, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Платформа</label>
                      <select
                        value={acc.platform}
                        onChange={(e) => updateAccount(i, 'platform', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      >
                        <option value="FACEBOOK">Facebook / Meta</option>
                        <option value="GOOGLE">Google Ads</option>
                        <option value="TIKTOK">TikTok Ads</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">ID кабінету</label>
                      <input
                        value={acc.accountId}
                        onChange={(e) => updateAccount(i, 'accountId', e.target.value)}
                        placeholder="act_123456789"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Назва</label>
                      <input
                        value={acc.name}
                        onChange={(e) => updateAccount(i, 'name', e.target.value)}
                        placeholder="Основний"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccount(i)}
                      disabled={adAccounts.length === 1}
                      className="p-2.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Створюємо...</> : 'Створити клієнта'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
