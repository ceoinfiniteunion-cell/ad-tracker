// Зберігаємо невдалі спроби входу в пам'яті
// В продакшені краще Redis, але для MVP цього достатньо

interface Attempts {
  count: number
  lastAt: number
  blockedUntil?: number
}

const MAX_ATTEMPTS = 5        // максимум спроб
const WINDOW_MS = 15 * 60000  // вікно 15 хвилин
const BLOCK_MS = 30 * 60000   // блок 30 хвилин

class LoginAttempts {
  private store = new Map<string, Attempts>()

  get(email: string): Attempts | undefined {
    const rec = this.store.get(email)
    if (!rec) return undefined
    // Чистимо старі записи
    if (Date.now() - rec.lastAt > WINDOW_MS && !rec.blockedUntil) {
      this.store.delete(email)
      return undefined
    }
    return rec
  }

  recordFail(email: string): void {
    const rec = this.store.get(email) ?? { count: 0, lastAt: Date.now() }
    rec.count++
    rec.lastAt = Date.now()

    if (rec.count >= MAX_ATTEMPTS) {
      rec.blockedUntil = Date.now() + BLOCK_MS
      console.warn(`[SECURITY] Login blocked for ${email} after ${rec.count} attempts`)
    }

    this.store.set(email, rec)
  }

  reset(email: string): void {
    this.store.delete(email)
  }

  isBlocked(email: string): boolean {
    const rec = this.get(email)
    if (!rec?.blockedUntil) return false
    if (Date.now() > rec.blockedUntil) {
      this.store.delete(email)
      return false
    }
    return true
  }

  getRemainingMins(email: string): number {
    const rec = this.get(email)
    if (!rec?.blockedUntil) return 0
    return Math.ceil((rec.blockedUntil - Date.now()) / 60000)
  }
}

export const loginAttempts = new LoginAttempts()
