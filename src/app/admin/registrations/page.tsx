'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { CheckCircle, XCircle, Clock, Users, Building2, Phone, Mail } from 'lucide-react'

interface RegUser {
  id: string; name: string; email: string; company: string | null; phone: string | null
  status: 'PENDING' | 'ACTIVE' | 'REJECTED'; createdAt: string; client: { id: string } | null
}

const statusConfig = {
  PENDING:  { label: 'На розгляді', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  ACTIVE:   { label: 'Активний',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: CheckCircle },
  REJECTED: { label: 'Відхилено',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: XCircle },
}

export default function AdminRegistrationsPage() {
  const [users, setUsers] = useState<RegUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('PENDING')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = () => { fetch('/api/admin/registrations').then(r => r.json()).then(d => { setUsers(d); setLoading(false) }) }
  useEffect(() => { load() }, [])

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId + action)
    await fetch('/api/admin/registrations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action }) })
    load()
    setActionLoading(null)
  }

  const filtered = filter === 'ALL' ? users : users.filter(u => u.status === filter)
  const pendingCount = users.filter(u => u.status === 'PENDING').length

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 40px' }}>
          <div className="anim-fade" style={{ marginBottom: '32px' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text3)', marginBottom: '8px' }}>// АДМІН ПАНЕЛЬ</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Реєстрації</h1>
              {pendingCount > 0 && <span style={{ background: '#e60000', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: 100 }}>{pendingCount} нових</span>}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>Клієнти що подали заявку на доступ</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', background: filter === f ? '#e60000' : 'var(--bg2)', color: filter === f ? '#fff' : 'var(--text3)' }}>
                {f === 'ALL' ? `Всі (${users.length})` : f === 'PENDING' ? `На розгляді (${users.filter(u=>u.status==='PENDING').length})` : f === 'ACTIVE' ? `Активні (${users.filter(u=>u.status==='ACTIVE').length})` : `Відхилені (${users.filter(u=>u.status==='REJECTED').length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid rgba(230,0,0,0.2)', borderTopColor: '#e60000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '60px 40px', textAlign: 'center' }}>
              <Users size={36} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>Заявок немає</p>
              <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>{filter === 'PENDING' ? 'Нових заявок на розгляд немає' : 'В цьому статусі заявок немає'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((user, i) => {
                const sc = statusConfig[user.status]
                const StatusIcon = sc.icon
                return (
                  <div key={user.id} className="anim-up" style={{ background: 'var(--bg2)', border: `1px solid ${user.status === 'PENDING' ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`, borderRadius: '12px', padding: '20px 24px', animationDelay: `${i * 40}ms` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{user.name}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.color }}>
                            <StatusIcon size={11} />{sc.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)' }}><Mail size={12} />{user.email}</span>
                          {user.company && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)' }}><Building2 size={12} />{user.company}</span>}
                          {user.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)' }}><Phone size={12} />{user.phone}</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', marginBottom: 0, fontFamily: 'monospace' }}>
                          Подано: {new Date(user.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {user.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => handleAction(user.id, 'approve')} disabled={!!actionLoading}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>
                            <CheckCircle size={14} />{actionLoading === user.id + 'approve' ? '...' : 'Схвалити'}
                          </button>
                          <button onClick={() => handleAction(user.id, 'reject')} disabled={!!actionLoading}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}>
                            <XCircle size={14} />{actionLoading === user.id + 'reject' ? '...' : 'Відхилити'}
                          </button>
                        </div>
                      )}
                      {user.status === 'ACTIVE' && user.client && (
                        <a href={`/admin/clients/${user.client.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '13px', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>Профіль клієнта →</a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
