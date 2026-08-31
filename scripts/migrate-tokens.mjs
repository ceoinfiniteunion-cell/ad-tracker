import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function isEncrypted(text) {
  return text.split(':').length === 3
}

async function main() {
  const accounts = await prisma.adAccount.findMany({
    where: { accessToken: { not: null } },
    select: { id: true, name: true, accessToken: true, refreshToken: true }
  })
  console.log(`Знайдено ${accounts.length} акаунтів з токенами`)
  for (const account of accounts) {
    const needsEncrypt = account.accessToken && !isEncrypted(account.accessToken)
    if (!needsEncrypt) { console.log(`✓ ${account.name} — вже зашифровано`); continue }
    await prisma.adAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encrypt(account.accessToken),
        refreshToken: account.refreshToken && !isEncrypted(account.refreshToken) ? encrypt(account.refreshToken) : account.refreshToken
      }
    })
    console.log(`✅ ${account.name} — зашифровано`)
  }
  console.log('Міграція завершена')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
