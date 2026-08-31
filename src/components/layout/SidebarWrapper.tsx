'use client'
import dynamic from 'next/dynamic'

const Sidebar = dynamic(
  () => import('./Sidebar').then(m => ({ default: m.Sidebar })),
  { ssr: false, loading: () => <div style={{ width:0, flexShrink:0 }}/> }
)

export { Sidebar }
