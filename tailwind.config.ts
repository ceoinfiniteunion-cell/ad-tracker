import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}','./src/components/**/*.{js,ts,jsx,tsx,mdx}','./src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fff0f0', 100:'#ffe0e0', 400:'#ff6b6b', 500:'#ff3333', 600:'#e60000', 700:'#cc0000', 900:'#1a0000' },
        dark: { 50:'#2a2a2a', 100:'#1e1e1e', 200:'#161616', 300:'#111111', 400:'#0d0d0d', 500:'#0a0a0a' }
      }
    }
  },
  plugins: [],
}
export default config
