import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Orbital ring ellipse */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 3,
            width: 26,
            height: 14,
            borderRadius: '50%',
            border: '1px solid #ef4444',
            opacity: 0.85,
            display: 'flex',
          }}
        />

        {/* Infinity symbol */}
        <div
          style={{
            fontSize: 18,
            color: 'white',
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'serif',
            letterSpacing: '-1px',
            display: 'flex',
          }}
        >
          ∞
        </div>

        {/* Red dot at top of orbital ring */}
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 3px #ef4444',
            display: 'flex',
            marginLeft: -2,
          }}
        />

        {/* Red cursor arrow top-right */}
        <div
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '7px solid #ef4444',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
