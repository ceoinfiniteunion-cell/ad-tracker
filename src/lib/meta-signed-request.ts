import { createHmac, timingSafeEqual } from 'crypto'

export interface MetaSignedRequest {
  algorithm: string
  user_id: string
  issued_at?: number
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

// signed_request від Meta: "<sig>.<payload>", sig = HMAC-SHA256(payload, app secret)
export function parseMetaSignedRequest(signedRequest: string, appSecret: string): MetaSignedRequest | null {
  const [sig, payload] = signedRequest.split('.', 2)
  if (!sig || !payload) return null

  const expected = createHmac('sha256', appSecret).update(payload).digest()
  const received = b64url(sig)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

  try {
    const data = JSON.parse(b64url(payload).toString('utf8'))
    if (data.algorithm?.toUpperCase() !== 'HMAC-SHA256' || !data.user_id) return null
    return data
  } catch {
    return null
  }
}
