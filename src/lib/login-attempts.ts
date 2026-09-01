import { prisma } from './prisma'

const MAX_ATTEMPTS = 5
const BLOCK_MS = 30 * 60 * 1000 // 30 хвилин

export const loginAttempts = {
  async get(email: string) {
    try {
      return await prisma.loginAttempt.findUnique({ where: { email } })
    } catch { return null }
  },

  async recordFail(email: string) {
    try {
      const now = new Date()
      const existing = await prisma.loginAttempt.findUnique({ where: { email } })
      
      if (existing) {
        const newCount = existing.count + 1
        const blockedUntil = newCount >= MAX_ATTEMPTS 
          ? new Date(Date.now() + BLOCK_MS) 
          : existing.blockedUntil
        
        if (newCount >= MAX_ATTEMPTS) {
          console.warn(`[SECURITY] Login blocked for ${email} after ${newCount} attempts`)
        }

        await prisma.loginAttempt.update({
          where: { email },
          data: { count: newCount, lastAt: now, blockedUntil }
        })
      } else {
        await prisma.loginAttempt.create({
          data: { email, count: 1, lastAt: now }
        })
      }
    } catch (e) {
      console.error('[LOGIN ATTEMPTS] DB error:', e)
    }
  },

  async reset(email: string) {
    try {
      await prisma.loginAttempt.deleteMany({ where: { email } })
    } catch {}
  },

  async isBlocked(email: string): Promise<{ blocked: boolean; minsLeft: number }> {
    try {
      const rec = await prisma.loginAttempt.findUnique({ where: { email } })
      if (!rec?.blockedUntil) return { blocked: false, minsLeft: 0 }
      if (new Date() > rec.blockedUntil) {
        await this.reset(email)
        return { blocked: false, minsLeft: 0 }
      }
      const minsLeft = Math.ceil((rec.blockedUntil.getTime() - Date.now()) / 60000)
      return { blocked: true, minsLeft }
    } catch {
      return { blocked: false, minsLeft: 0 }
    }
  }
}
