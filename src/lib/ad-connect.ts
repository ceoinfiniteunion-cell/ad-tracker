import { Platform } from '@prisma/client'
import { prisma } from './prisma'
import { encrypt, decrypt } from './crypto'
import { sealToken } from './token-store'
import { syncAdAccount } from './ad-sync'

// Кабінети, знайдені після OAuth: один додається одразу, кілька — через вибір користувача

export interface DiscoveredAccount {
  externalId: string
  name: string
  currency?: string
  loginCustomerId?: string | null
}

export interface ConnectTokens {
  accessToken: string
  refreshToken?: string | null
}

export interface ConnectResult {
  connected: number
  synced: number
  skipped: string[]
  errors: string[]
}

const PENDING_TTL_MS = 15 * 60 * 1000

// TikTok-метрики зберігаються в USD (див. ad-sync), тому валюту кабінету для нього не беремо
const storesNativeCurrency = (platform: Platform) => platform !== 'TIKTOK'

export async function connectAndSync(clientId: string, platform: Platform, tokens: ConnectTokens, accounts: DiscoveredAccount[]): Promise<ConnectResult> {
  const result: ConnectResult = { connected: 0, synced: 0, skipped: [], errors: [] }
  const accessToken = sealToken(tokens.accessToken)
  const refreshToken = sealToken(tokens.refreshToken)
  const connectedIds: string[] = []

  for (const acc of accounts) {
    const existing = await prisma.adAccount.findUnique({ where: { accountId_platform: { accountId: acc.externalId, platform } } })
    if (existing && existing.clientId !== clientId) {
      result.skipped.push(`${acc.name}: вже підключений до іншого клієнта`)
      continue
    }
    const data = {
      name: acc.name,
      accessToken,
      // Google віддає refresh token лише при першій згоді — не затираємо збережений
      ...(refreshToken ? { refreshToken } : {}),
      loginCustomerId: acc.loginCustomerId ?? null,
      ...(acc.currency && storesNativeCurrency(platform) ? { accountCurrency: acc.currency } : {}),
      tokenStatus: 'valid',
      isActive: true,
    }
    const saved = existing
      ? await prisma.adAccount.update({ where: { id: existing.id }, data })
      : await prisma.adAccount.create({ data: { ...data, clientId, platform, accountId: acc.externalId } })
    connectedIds.push(saved.id)
    result.connected++
  }

  // Заглушка зі старого Google-флоу, коли Customer ID вводили вручну
  if (platform === 'GOOGLE') {
    await prisma.adAccount.deleteMany({ where: { clientId, platform: 'GOOGLE', accountId: 'pending' } })
  }

  for (const id of connectedIds) {
    const account = await prisma.adAccount.findUniqueOrThrow({ where: { id } })
    try {
      await syncAdAccount(account)
      result.synced++
    } catch (e) {
      result.errors.push(`${account.name}: ${(e as Error).message}`)
    }
  }
  return result
}

export async function createPendingConnection(userId: string, clientId: string, platform: Platform, tokens: ConnectTokens, accounts: DiscoveredAccount[]): Promise<string> {
  await prisma.pendingAdConnection.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] } })
  const pending = await prisma.pendingAdConnection.create({
    data: {
      userId, clientId, platform,
      payload: encrypt(JSON.stringify({ tokens, accounts })),
      expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    },
  })
  return pending.id
}

export async function loadPendingConnection(id: string, userId: string) {
  const pending = await prisma.pendingAdConnection.findUnique({ where: { id } })
  if (!pending || pending.userId !== userId) return null
  if (pending.expiresAt < new Date()) {
    await prisma.pendingAdConnection.delete({ where: { id } })
    return null
  }
  const { tokens, accounts } = JSON.parse(decrypt(pending.payload)) as { tokens: ConnectTokens; accounts: DiscoveredAccount[] }
  return { id: pending.id, clientId: pending.clientId, platform: pending.platform, tokens, accounts }
}

export async function deletePendingConnection(id: string) {
  await prisma.pendingAdConnection.deleteMany({ where: { id } })
}

// Куди повертати користувача після OAuth callback
export async function handleDiscovered(baseUrl: string, userId: string, clientId: string, platform: Platform, tokens: ConnectTokens, accounts: DiscoveredAccount[]): Promise<string> {
  const slug = platform === 'FACEBOOK' ? 'meta' : platform.toLowerCase()
  if (accounts.length === 0) return `${baseUrl}/connect?error=no_accounts&platform=${slug}`

  if (accounts.length > 1) {
    const pendingId = await createPendingConnection(userId, clientId, platform, tokens, accounts)
    return `${baseUrl}/connect?pending=${pendingId}`
  }

  const r = await connectAndSync(clientId, platform, tokens, accounts)
  const params = new URLSearchParams({ success: slug, accounts: String(r.connected), synced: String(r.synced) })
  const problems = [...r.skipped, ...r.errors]
  if (problems.length) params.set('msg', problems.join('\n').slice(0, 500))
  return `${baseUrl}/connect?${params.toString()}`
}
