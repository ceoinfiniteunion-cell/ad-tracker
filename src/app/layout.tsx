import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
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
        <Providers><BgImage />{children}</Providers>
      </body>
    </html>
  )
}
