import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: '#ef4444',
            fontSize: 20,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'serif',
            marginTop: -1,
          }}
        >
          ∞
        </div>
      </div>
    ),
    { ...size },
  )
}
