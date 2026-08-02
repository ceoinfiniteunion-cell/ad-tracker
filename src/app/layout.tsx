import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PageTransition } from '@/components/layout/PageTransition'
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
        <Providers><div style={{position:'fixed',inset:0,zIndex:-1,pointerEvents:'none'}}>
          <img src="/bg-painting.jpeg" alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.05,filter:'blur(3px)'}}/>
        </div>
        <PageTransition>{children}</PageTransition></Providers>
      </body>
    </html>
  )
}
