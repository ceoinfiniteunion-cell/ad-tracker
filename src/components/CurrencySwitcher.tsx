'use client'
import { useEffect, useState } from 'react'

const CURRENCIES = [
  { code: 'USD', label: '$ USD', symbol: '$' },
  { code: 'UAH', label: '₴ UAH', symbol: '₴' },
  { code: 'EUR', label: '€ EUR', symbol: '€' },
] as const

interface Props {
  currency: string
  onChange: (currency: string) => void
}

export function CurrencySwitcher({ currency, onChange }: Props) {
  const [saving, setSaving] = useState(false)
  const [rate, setRate] = useState<string | null>(null)

  useEffect(() => {
    if (currency === 'USD') { setRate(null); return }
    fetch('/api/currency/rates')
      .then(r => r.json())
      .then(d => {
        const raw = d?.rates?.[currency]
        if (raw) setRate(Number(raw).toFixed(raw >= 10 ? 1 : 3))
        else setRate(null)
      })
      .catch(() => setRate(null))
  }, [currency])

  const currentIdx = CURRENCIES.findIndex(c => c.code === currency)
  const current = CURRENCIES[currentIdx === -1 ? 0 : currentIdx]
  const next = CURRENCIES[(currentIdx + 1) % CURRENCIES.length]

  const handleClick = async () => {
    if (saving) return
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: next.code }),
      })
      onChange(next.code)
    } catch {}
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
      <button
        onClick={handleClick}
        disabled={saving}
        title={`Змінити на ${next.label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border2)',
          background: 'var(--bg2)',
          color: 'var(--text2)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: saving ? 'wait' : 'pointer',
          transition: 'all 0.15s ease',
          fontFamily: 'monospace',
          flexShrink: 0,
          opacity: saving ? 0.6 : 1,
          letterSpacing: '0.02em',
        }}
      >
        {current.label}
      </button>
      {rate !== null && (
        <span style={{
          fontSize: '10px',
          color: 'var(--text4)',
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          1 USD = {rate} {current.symbol}
        </span>
      )}
    </div>
  )
}
