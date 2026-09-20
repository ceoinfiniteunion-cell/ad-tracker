'use client'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/lib/theme'
import { ModeProvider } from '@/contexts/ModeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ModeProvider>{children}</ModeProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
