'use client'
import { useMode } from '@/contexts/ModeContext'

export function ModeToggle() {
  const { mode, toggle } = useMode()
  const isBeginner = mode === 'beginner'

  return (
    <button
      onClick={toggle}
      title={isBeginner ? 'Перейти в режим Про' : 'Перейти в режим Новачок'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '10px',
        border: `1px solid ${isBeginner ? 'rgba(230,0,0,0.35)' : 'var(--border2)'}`,
        background: isBeginner ? 'rgba(230,0,0,0.1)' : 'var(--bg2)',
        color: isBeginner ? '#ff6060' : 'var(--text3)',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {isBeginner ? '⚡ Про режим' : '🎯 Новачок'}
    </button>
  )
}
