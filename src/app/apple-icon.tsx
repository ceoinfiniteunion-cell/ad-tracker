import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '36px',
          position: 'relative',
        }}
      >
        {/* Outer orbital ring */}
        <div
          style={{
            position: 'absolute',
            top: 38,
            left: 18,
            width: 144,
            height: 78,
            borderRadius: '50%',
            border: '2.5px solid #ef4444',
            opacity: 0.9,
            display: 'flex',
          }}
        />

        {/* Inner subtle ring */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 30,
            width: 120,
            height: 56,
            borderRadius: '50%',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
          }}
        />

        {/* Infinity symbol */}
        <div
          style={{
            fontSize: 88,
            color: 'white',
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-4px',
            display: 'flex',
            textShadow: '0 0 20px rgba(255,255,255,0.15)',
          }}
        >
          ∞
        </div>

        {/* Red glowing dot at top of orbital ring */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 10px 4px rgba(239,68,68,0.6)',
            display: 'flex',
            marginLeft: -9,
          }}
        />

        {/* Red cursor arrow overlapping top-right of infinity */}
        <div
          style={{
            position: 'absolute',
            top: 42,
            right: 34,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Arrow triangle body */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: '18px solid #ef4444',
              display: 'flex',
              filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))',
            }}
          />
          {/* Arrow stem */}
          <div
            style={{
              width: 6,
              height: 10,
              background: '#ef4444',
              marginTop: -1,
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
