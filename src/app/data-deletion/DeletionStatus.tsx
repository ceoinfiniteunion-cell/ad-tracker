'use client'
import { useEffect, useState } from 'react'

type Status = { code: string; status: string; receivedAt: string; completedAt: string | null }

const LABEL: Record<string, string> = {
  received: 'Received — your data will be deleted within 30 days.',
  completed: 'Completed — your data has been deleted.',
}

// Статус запиту на видалення, якщо сторінку відкрили за посиланням від Meta (?code=...)
export function DeletionStatus() {
  const [code, setCode] = useState<string | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('code')
    if (!c) return
    setCode(c)
    fetch(`/api/meta/data-deletion?code=${encodeURIComponent(c)}`)
      .then(async r => (r.ok ? setStatus(await r.json()) : setError('No deletion request found for this confirmation code.')))
      .catch(() => setError('Could not load the request status. Please try again later.'))
  }, [])

  if (!code) return null
  return (
    <div style={{ padding: '16px 20px', border: '1px solid #eee', borderRadius: '10px', background: '#fafafa', marginBottom: '32px' }}>
      <p style={{ margin: 0, fontWeight: 700 }}>Deletion request <code>{code}</code></p>
      {status && (
        <p style={{ margin: '6px 0 0' }}>
          {LABEL[status.status] ?? status.status}
          <br /><span style={{ color: '#666', fontSize: '14px' }}>Received: {new Date(status.receivedAt).toUTCString()}</span>
        </p>
      )}
      {error && <p style={{ margin: '6px 0 0', color: '#c00' }}>{error}</p>}
      {!status && !error && <p style={{ margin: '6px 0 0', color: '#666' }}>Loading…</p>}
    </div>
  )
}
