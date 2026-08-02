import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RippleEffect } from '@/components/layout/RippleEffect'
import { BgImage } from '@/components/layout/BgImage'
import { Providers } from '@/components/layout/Providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Ad Tracker — Аналітика реклами',
  description: 'Платформа для відстеження рекламних кампаній',
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
