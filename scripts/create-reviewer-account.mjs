// Тестовий акаунт для рев'юерів Meta App Review: CLIENT, ACTIVE, без 2FA.
// Повторний запуск генерує новий пароль. Запуск: railway run node scripts/create-reviewer-account.mjs
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const EMAIL = 'meta.reviewer@infiniteunion.com.ua'
const prisma = new PrismaClient()

// Без схожих символів (0/O, 1/l/I), щоб пароль легко передрукувати
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const password = Array.from(crypto.randomBytes(16), b => ALPHABET[b % ALPHABET.length]).join('') + '!'

async function main() {
  const hash = await bcrypt.hash(password, 12)
  const data = { password: hash, role: 'CLIENT', status: 'ACTIVE', twoFactorEnabled: false, twoFactorCode: null, twoFactorExpiry: null }
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: data,
    create: { ...data, email: EMAIL, name: 'Meta App Reviewer', company: 'Meta App Review' },
  })
  await prisma.client.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, name: 'Meta App Reviewer', company: 'Meta App Review', currency: 'USD' },
  })
  await prisma.loginAttempt.deleteMany({ where: { email: EMAIL } })
  console.log(`Email:    ${EMAIL}\nPassword: ${password}`)
}

main()
  .catch(e => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
