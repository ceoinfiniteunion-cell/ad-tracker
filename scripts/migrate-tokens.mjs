// Шифрує відкриті accessToken/refreshToken в ad_accounts (AES-256-GCM, як src/lib/crypto.ts).
// Запуск з прод-оточенням:  railway run node scripts/migrate-tokens.mjs           (dry run)
//                            railway run node scripts/migrate-tokens.mjs --apply   (запис)
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTED_RE = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i
const APPLY = process.argv.includes('--apply')

const hex = process.env.ENCRYPTION_KEY
if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
  console.error('ENCRYPTION_KEY must be set to 64 hex chars')
  process.exit(1)
}
const KEY = Buffer.from(hex, 'hex')
const prisma = new PrismaClient()

const isEncrypted = (text) => ENCRYPTED_RE.test(text)

function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(text) {
  const [iv, tag, data] = text.split(':')
  const d = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'))
  d.setAuthTag(Buffer.from(tag, 'hex'))
  return d.update(Buffer.from(data, 'hex')) + d.final('utf8')
}

async function main() {
  const accounts = await prisma.adAccount.findMany({
    where: { OR: [{ accessToken: { not: null } }, { refreshToken: { not: null } }] },
    select: { id: true, name: true, platform: true, accessToken: true, refreshToken: true },
  })

  // Ключ має збігатися з тим, яким вже зашифровані токени — інакше зупиняємось
  const existing = accounts.flatMap(a => [a.accessToken, a.refreshToken]).filter(v => v && isEncrypted(v))
  for (const value of existing) {
    try { decrypt(value) } catch {
      console.error('ENCRYPTION_KEY does not match already-encrypted tokens. Aborting, nothing written.')
      process.exit(1)
    }
  }
  console.log(`Акаунтів з токенами: ${accounts.length}, вже зашифрованих значень: ${existing.length} (ключ перевірено)`)

  let changed = 0
  for (const a of accounts) {
    const data = {}
    if (a.accessToken && !isEncrypted(a.accessToken)) data.accessToken = encrypt(a.accessToken)
    if (a.refreshToken && !isEncrypted(a.refreshToken)) data.refreshToken = encrypt(a.refreshToken)
    if (Object.keys(data).length === 0) continue
    changed++
    console.log(`${APPLY ? '✅' : '→'} ${a.platform} ${a.name}: ${Object.keys(data).join(', ')}`)
    if (APPLY) await prisma.adAccount.update({ where: { id: a.id }, data })
  }

  console.log(APPLY ? `Зашифровано акаунтів: ${changed}` : `Dry run: буде зашифровано ${changed}. Запустіть з --apply.`)
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
