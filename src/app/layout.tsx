import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RippleEffect } from '@/components/layout/RippleEffect'
import { BgImage } from '@/components/layout/BgImage'
import { Providers } from '@/components/layout/Providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false }

export const metadata: Metadata = {
  title: 'Ad Tracker — Аналітика реклами',
  description: 'Платформа для відстеження рекламних кампаній',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <Providers><BgImage /><RippleEffect />{children}</Providers>
      </body>
    </html>
  )
}
