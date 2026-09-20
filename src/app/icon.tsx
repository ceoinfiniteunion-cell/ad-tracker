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
          background: '#0d0d0d',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28">
          {/* White infinity symbol — two interlocking lobes */}
          <path
            d="M14 14c-0.6-1.8-2.2-3.2-4-3.2C7.6 10.8 6 12.2 6 14s1.6 3.2 4 3.2c1.8 0 3.4-1.4 4-3.2z M14 14c0.6 1.8 2.2 3.2 4 3.2 2.4 0 4-1.4 4-3.2s-1.6-3.2-4-3.2c-1.8 0-3.4 1.4-4 3.2z"
            fill="white"
          />
          {/* Red orbital ellipse */}
          <ellipse
            cx="14"
            cy="14"
            rx="11"
            ry="6.5"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
            opacity="0.85"
          />
          {/* Red cursor arrow — top right */}
          <polygon points="21,3 24,6 22.5,6 22.5,10 19.5,10 19.5,6 18,6" fill="#ef4444" />
          {/* Red glowing dot at top of orbital ring */}
          <circle cx="14" cy="7.5" r="1.8" fill="#ef4444" />
        </svg>
      </div>
    ),
    { width: 32, height: 32 },
  )
}
