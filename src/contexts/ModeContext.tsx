'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'beginner' | 'advanced'

interface ModeContextValue {
  mode: Mode
  toggle: () => void
}

const ModeContext = createContext<ModeContextValue>({ mode: 'advanced', toggle: () => {} })

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('advanced')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard_mode') as Mode
      if (saved === 'beginner' || saved === 'advanced') setMode(saved)
    } catch {}
  }, [])

  const toggle = () => {
    const next: Mode = mode === 'advanced' ? 'beginner' : 'advanced'
    setMode(next)
    try { localStorage.setItem('dashboard_mode', next) } catch {}
  }

  return <ModeContext.Provider value={{ mode, toggle }}>{children}</ModeContext.Provider>
}

export const useMode = () => useContext(ModeContext)
