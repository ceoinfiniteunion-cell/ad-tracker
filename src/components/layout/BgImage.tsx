'use client'
export function BgImage() {
  return (
    <img
      src='/bg-painting.jpeg'
      alt=''
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.08,
        filter: 'blur(2px)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
