import type { ReactNode } from 'react'

// Спільний вигляд публічних юридичних сторінок (Privacy, Terms, Data Deletion)
export const h2Style = { fontSize: '20px', fontWeight: 700, marginTop: '32px' } as const
export const linkStyle = { color: '#e60000' } as const
export const CONTACT_EMAIL = 'ceo@infiniteunion.com.ua'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', overflowY: 'auto', zIndex: 9999 }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) 16px', fontFamily: 'system-ui, sans-serif', color: '#333', lineHeight: 1.7 }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>{title}</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>Last updated: {updated}</p>
        {children}
        <p style={{ marginTop: '40px', color: '#999', fontSize: '14px' }}>
          <a href="/privacy" style={{ color: '#999' }}>Privacy Policy</a> · <a href="/terms" style={{ color: '#999' }}>Terms of Service</a> · <a href="/data-deletion" style={{ color: '#999' }}>Data Deletion</a>
          <br />© 2026 Infinite Union. All rights reserved.
        </p>
      </div>
    </div>
  )
}
