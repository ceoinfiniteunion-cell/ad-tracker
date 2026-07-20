'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Users, Plus, Building2, Mail, ArrowRight, Loader2 } from 'lucide-react'

interface ClientData {
  id: string; name: string; company: string
  user: { email: string; name: string; createdAt: string }
  adAccounts: { id: string; platform: string; accountId: string; name: string }[]
}

const PLATFORM_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  FACEBOOK: { bg: 'rgba(24,119,242,0.12)', color: '#1877f2', label: 'Meta' },
  GOOGLE: { bg: 'rgba(230,0,0,0.12)', color: '#e60000', label: 'Google' },
  TIKTOK: { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', label: 'TikTok' },
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { setClients(d); setLoading(false) })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0a0a0a'}}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-8 animate-fade-in">
            <div>
              <p className="mono text-xs mb-2" style={{color:'rgba(255,255,255,0.3)'}}>// АДМІН ПАНЕЛЬ</p>
              <h1 className="text-2xl font-bold text-white">Клієнти</h1>
              <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.4)'}}>Управління клієнтами та рекламними кабінетами</p>
            </div>
            <Link href="/admin/new-client" className="iu-btn">
              <Plus className="w-4 h-4" />Новий клієнт
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin" style={{borderTopColor:'#e60000'}} />
            </div>
          ) : clients.length === 0 ? (
            <div className="iu-card p-16 text-center">
              <Users className="w-10 h-10 mx-auto mb-4" style={{color:'rgba(255,255,255,0.15)'}} />
              <p className="text-white font-medium mb-1">Клієнтів ще немає</p>
              <p className="text-sm mb-6" style={{color:'rgba(255,255,255,0.35)'}}>Додайте першого клієнта щоб почати</p>
              <Link href="/admin/new-client" className="iu-btn inline-flex"><Plus className="w-4 h-4" />Додати клієнта</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client, i) => (
                <div key={client.id} className="iu-card p-5 animate-slide-up" style={{animationDelay:`${i*50}ms`,opacity:0}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(230,0,0,0.1)',border:'1px solid rgba(230,0,0,0.2)'}}>
                        <span className="font-bold text-sm" style={{color:'#e60000'}}>{client.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{client.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{color:'rgba(255,255,255,0.35)'}}><Building2 className="w-3 h-3" />{client.company}</span>
                          <span className="flex items-center gap-1 text-xs" style={{color:'rgba(255,255,255,0.35)'}}><Mail className="w-3 h-3" />{client.user.email}</span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {client.adAccounts.map(acc => {
                            const s = PLATFORM_STYLE[acc.platform] ?? { bg:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)', label: acc.platform }
                            return <span key={acc.id} className="mono text-xs px-2 py-0.5 rounded" style={{background:s.bg,color:s.color}}>{s.label} · {acc.accountId}</span>
                          })}
                          {client.adAccounts.length === 0 && <span className="mono text-xs" style={{color:'rgba(255,255,255,0.25)'}}>Немає кабінетів</span>}
                        </div>
                      </div>
                    </div>
                    <button className="iu-btn-ghost text-xs"><ArrowRight className="w-3.5 h-3.5" /></button>
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
