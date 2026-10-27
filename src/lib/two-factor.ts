import { prisma } from './prisma'
import { rateLimit } from './rate-limit'
import { sendTwoFactorCode } from './email'

export type TwoFactorCheck = 'ok' | 'missing' | 'expired' | 'invalid'

export const TWO_FACTOR_ERRORS: Record<Exclude<TwoFactorCheck, 'ok'>, string> = {
  missing: 'Код не було відправлено. Спробуйте знову.',
  expired: 'Код протермінований. Запросіть новий.',
  invalid: 'Невірний код',
}

const CODE_TTL_MS = 10 * 60 * 1000

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Генерує новий код, зберігає і шле на email. Не частіше 3 разів за 10 хв на юзера.
export async function issueTwoFactorCode(user: { id: string; email: string; name: string }): Promise<{ ok: boolean }> {
  const { ok } = await rateLimit(`2fa:send:${user.id}`, 3, CODE_TTL_MS)
  if (!ok) return { ok: false }

  const code = generateCode()
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorCode: code, twoFactorExpiry: new Date(Date.now() + CODE_TTL_MS) },
  })
  await sendTwoFactorCode(user.email, code, user.name)
  return { ok: true }
}

// Перевіряє код і при успіху одразу його гасить (одноразовий)
export async function consumeTwoFactorCode(userId: string, code: string): Promise<TwoFactorCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorCode: true, twoFactorExpiry: true },
  })
  if (!user?.twoFactorCode || !user.twoFactorExpiry) return 'missing'

  if (new Date() > user.twoFactorExpiry) {
    await prisma.user.update({ where: { id: userId }, data: { twoFactorCode: null, twoFactorExpiry: null } })
    return 'expired'
  }

  if (user.twoFactorCode !== code.trim()) return 'invalid'

  await prisma.user.update({ where: { id: userId }, data: { twoFactorCode: null, twoFactorExpiry: null } })
  return 'ok'
}
