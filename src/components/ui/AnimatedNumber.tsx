'use client'
import { useEffect, useState, useRef } from 'react'

interface Props {
  value: string
  duration?: number
  style?: React.CSSProperties
  className?: string
}

export function AnimatedNumber({ value, duration = 1000, style, className }: Props) {
  const [display, setDisplay] = useState('0')
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current === value) return
    prevValue.current = value

    // Витягуємо числа з рядка типу "$30 531 USD" або "2 572 178"
    const numMatch = value.replace(/\s/g, '').match(/[\d.]+/)
    if (!numMatch) { setDisplay(value); return }

    const target = parseFloat(numMatch[0])
    const prefix = value.substring(0, value.search(/[\d]/))
    const suffix = value.substring(value.lastIndexOf(numMatch[0].replace(/\./g, '').split('').join('')) + numMatch[0].length)

    const start = Date.now()
    const startVal = 0

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Easing
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (target - startVal) * eased

      // Форматуємо як оригінал
      let formatted: string
      if (value.includes('.')) {
        formatted = current.toFixed(2)
      } else {
        formatted = Math.round(current).toLocaleString('uk')
      }
      setDisplay(prefix + formatted + suffix)

      if (progress < 1) requestAnimationFrame(tick)
      else setDisplay(value)
    }

    requestAnimationFrame(tick)
  }, [value, duration])

  useEffect(() => { setDisplay(value) }, [])

  return <span style={style} className={className}>{display}</span>
}
