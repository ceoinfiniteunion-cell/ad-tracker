import { prisma } from './prisma'

export type TwoFactorCheck = 'ok' | 'missing' | 'expired' | 'invalid'

export const TWO_FACTOR_ERRORS: Record<Exclude<TwoFactorCheck, 'ok'>, string> = {
  missing: 'Код не було відправлено. Спробуйте знову.',
  expired: 'Код протермінований. Запросіть новий.',
  invalid: 'Невірний код',
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
