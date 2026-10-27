import { prisma } from './prisma'
import { encrypt, decrypt, isEncrypted } from './crypto'

export async function saveToken(adAccountId: string, accessToken: string, refreshToken?: string | null) {
  await prisma.adAccount.update({
    where: { id: adAccountId },
    data: {
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      tokenStatus: 'active',
    },
  })
}

export async function getToken(adAccountId: string): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const account = await prisma.adAccount.findUnique({
    where: { id: adAccountId },
    select: { accessToken: true, refreshToken: true },
  })
  if (!account) return { accessToken: null, refreshToken: null }
  return { accessToken: openToken(account.accessToken), refreshToken: openToken(account.refreshToken) }
}

// Для запису в БД: шифрує токен (порожній → null)
export function sealToken(token: string | null | undefined): string | null {
  return token ? encrypt(token) : null
}

// Для читання з БД: розшифровує; старі відкриті значення повертає як є
export function openToken(value: string | null | undefined): string | null {
  if (!value) return null
  return isEncrypted(value) ? decrypt(value) : value
}

// Токени ніколи не віддаються в API-відповідях
export function stripTokens<T extends { accessToken?: string | null; refreshToken?: string | null }>(account: T) {
  const { accessToken, refreshToken, ...rest } = account
  return { ...rest, hasToken: !!accessToken }
}
