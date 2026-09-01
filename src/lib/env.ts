const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'RESEND_API_KEY']
if (typeof window === 'undefined') {
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) console.warn('[ENV] Missing vars:', missing.join(', '))
}
export const env = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
} as const
