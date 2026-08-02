'use client'
import { useEffect } from 'react'

export function RippleEffect() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const btn = target.closest('.btn-ripple') as HTMLElement
      if (!btn) return
      const circle = document.createElement('span')
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      circle.className = 'ripple-circle'
      circle.style.width = circle.style.height = size + 'px'
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px'
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px'
      btn.appendChild(circle)
      setTimeout(() => circle.remove(), 700)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  return null
}
