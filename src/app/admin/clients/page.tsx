'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Users, Plus, Building2, Mail, ExternalLink, Loader2 } from 'lucide-react'

interface ClientData {
  id: string
  name: string
  company: string
  user: { email: string; name: string; createdAt: string }
  adAccounts: { id: string; platform: string; accountId: string; name: string }[]
}

const PLATFORM_BADGE: Record<string, string> = {
  FACEBOOK: 'bg-blue-100 text-blue-700',
  GOOGLE: 'bg-red-100 text-red-700',
  TIKTOK: 'bg-gray-100 text-gray-700',
}

const PLATFORM_LABEL: Record<string, string> = {
  FACEBOOK: 'Meta',
  GOOGLE: 'Google',
  TIKTOK: 'TikTok',
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => {
        setClients(d)
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Клієнти</h1>
              <p className="text-gray-500 mt-1">Управління клієнтами та їх рекламними кабінетами</p>
            </div>
            <Link
              href="/admin/new-client"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Новий клієнт
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Клієнтів ще немає. Додайте першого!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-brand-700 font-bold text-sm">
                          {client.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Building2 className="w-3.5 h-3.5" />
                            {client.company}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3.5 h-3.5" />
                            {client.user.email}
                          </span>
                        </div>
                        {/* Ad Accounts */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {client.adAccounts.map((acc) => (
                            <span
                              key={acc.id}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${PLATFORM_BADGE[acc.platform] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {PLATFORM_LABEL[acc.platform]} · {acc.accountId}
                            </span>
                          ))}
                          {client.adAccounts.length === 0 && (
                            <span className="text-xs text-gray-400">Кабінети не прив'язані</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Переглянути
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
