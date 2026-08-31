'use client'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface Log { id: string; action: string; userId: string; meta: any; createdAt: string }

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: 'check' | 'x' | 'refresh' }> = {
  LOGIN_SUCCESS:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: 'check' },
  LOGIN_FAILED:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: 'x' },
  REGISTER:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: 'check' },
  CLIENT_APPROVED:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: 'check' },
  CLIENT_REJECTED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: 'x' },
  SYNC_COMPLETED:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  icon: 'refresh' },
  SYNC_FAILED:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  icon: 'x' },
  SYNC_STARTED:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: 'refresh' },
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/admin/audit').then(r => r.json()).then(d => { setLogs(d); setLoading(false) })
  }, [])

  const actions = ['ALL', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'SYNC_COMPLETED', 'SYNC_FAILED', 'CLIENT_APPROVED']
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.action === filter)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 40px' }}>

          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text3)', marginBottom: '8px' }}>// АДМІН · БЕЗПЕКА</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={24} style={{ color: '#e60000' }} />
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Audit Log</h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px' }}>Останні 100 подій системи</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {actions.map(a => (
              <button key={a} onClick={() => setFilter(a)}
                style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', background: filter === a ? '#e60000' : 'var(--bg2)', color: filter === a ? '#fff' : 'var(--text3)', transition: 'all 0.15s' }}>
                {a === 'ALL' ? `Всі (${logs.length})` : a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '28px', height: '28px', border: '2px solid rgba(230,0,0,0.2)', borderTopColor: '#e60000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map(log => {
                const cfg = ACTION_CONFIG[log.action] ?? { color: '#888', bg: 'rgba(128,128,128,0.1)', icon: 'check' }
                return (
                  <div key={log.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {cfg.icon === 'check' && <CheckCircle size={14} style={{ color: cfg.color }} />}
                      {cfg.icon === 'x' && <XCircle size={14} style={{ color: cfg.color }} />}
                      {cfg.icon === 'refresh' && <RefreshCw size={14} style={{ color: cfg.color }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, fontFamily: 'monospace' }}>{log.action}</span>
                        {log.meta?.email && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{log.meta.email}</span>}
                        {log.meta?.reason && <span style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: '4px' }}>{log.meta.reason}</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontFamily: 'monospace' }}>
                        {log.userId !== 'unknown' && `user: ${log.userId.slice(0, 8)}...`}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', flexShrink: 0 }}>
                      {new Date(log.createdAt).toLocaleString('uk-UA')}
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>Подій не знайдено</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
