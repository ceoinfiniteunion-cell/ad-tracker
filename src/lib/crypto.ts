import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTED_RE = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i

// Без fallback на випадковий ключ: інакше токени, зашифровані одним інстансом, не читаються після рестарту
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be set to 64 hex chars (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  if (!isEncrypted(encryptedText)) return encryptedText
  const key = getKey()
  try {
    const [ivHex, tagHex, dataHex] = encryptedText.split(':')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8')
  } catch (e) {
    console.error('[CRYPTO] Decrypt failed — wrong ENCRYPTION_KEY or corrupted value')
    return encryptedText
  }
}

export function isEncrypted(text: string): boolean {
  return ENCRYPTED_RE.test(text)
}
