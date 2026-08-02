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
      circle.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(230,0,0,0.25);
        width: ${size}px;
        height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        transform: scale(0);
        opacity: 1;
        pointer-events: none;
        transition: transform 0.6s ease-out, opacity 0.6s ease-out;
      `
      btn.appendChild(circle)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          circle.style.transform = 'scale(4)'
          circle.style.opacity = '0'
        })
      })
      setTimeout(() => circle.remove(), 700)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
  return null
}
