import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { loginAttempts } from './login-attempts'
import { isTokenBlacklisted } from './jwt-blacklist'
import { randomUUID } from 'crypto'
import { consumeTwoFactorCode, issueTwoFactorCode, TWO_FACTOR_ERRORS } from './two-factor'
import { rateLimit } from './rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        code: { label: '2FA code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        // Перевірка блокування
        const { blocked, minsLeft } = await loginAttempts.isBlocked(email)
        if (blocked) {
          throw new Error(`Акаунт тимчасово заблоковано. Спробуйте через ${minsLeft} хв.`)
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) {
          await loginAttempts.recordFail(email)
          return null
        }

        // Перевірка статусу
        if ((user as any).status === 'PENDING') {
          throw new Error('Ваш акаунт очікує підтвердження адміністратора.')
        }
        if ((user as any).status === 'REJECTED') {
          throw new Error('Ваш акаунт відхилено. Зверніться до підтримки.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          await loginAttempts.recordFail(email)
          return null
        }

        // 2FA — перевіряється на сервері, обійти з клієнта не можна
        if (user.twoFactorEnabled) {
          const code = credentials.code?.trim()
          if (!code) {
            // Пароль вірний — тільки тепер шлемо код
            const sent = await issueTwoFactorCode(user)
            if (!sent.ok) throw new Error('Забагато запитів коду. Спробуйте через 10 хвилин.')
            throw new Error('2FA_REQUIRED')
          }

          const { ok } = await rateLimit(`2fa:login:${user.id}`, 5, 15 * 60 * 1000)
          if (!ok) throw new Error('Забагато спроб. Спробуйте через 15 хвилин.')

          const check = await consumeTwoFactorCode(user.id, code)
          if (check !== 'ok') throw new Error(TWO_FACTOR_ERRORS[check])
        }

        // Успішний вхід
        await loginAttempts.reset(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          jti: randomUUID(), // унікальний ID токена для blacklist
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.jti = (user as any).jti ?? randomUUID()

        if ((user as any).role === 'CLIENT') {
          const client = await prisma.client.findFirst({ where: { userId: user.id } })
          token.clientId = client?.id
        }
      }

      // Перевірка blacklist при кожному запиті
      if (token.jti) {
        const blacklisted = await isTokenBlacklisted(token.jti as string).catch(() => false)
        if (blacklisted) throw new Error('Token revoked')
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
        ;(session.user as any).clientId = token.clientId
        ;(session.user as any).jti = token.jti
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
