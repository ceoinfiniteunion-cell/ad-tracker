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
        opacity: 0.07,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
