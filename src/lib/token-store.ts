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

  return {
    accessToken: account.accessToken
      ? isEncrypted(account.accessToken)
        ? decrypt(account.accessToken)
        : account.accessToken
      : null,
    refreshToken: account.refreshToken
      ? isEncrypted(account.refreshToken)
        ? decrypt(account.refreshToken)
        : account.refreshToken
      : null,
  }
}
