import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { loginAttempts } from './login-attempts'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()

        // Перевірка блокування після невдалих спроб
        const attempts = loginAttempts.get(email)
        if (attempts && attempts.blockedUntil && Date.now() < attempts.blockedUntil) {
          const mins = Math.ceil((attempts.blockedUntil - Date.now()) / 60000)
          throw new Error(`Акаунт тимчасово заблоковано. Спробуйте через ${mins} хв.`)
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !user.password) {
          loginAttempts.recordFail(email)
          return null
        }

        // Перевірка статусу клієнта
        if (user.role === 'CLIENT') {
          const client = await prisma.client.findFirst({ where: { userId: user.id } })
          if (client && client.status !== 'ACTIVE') {
            throw new Error('Ваш акаунт очікує підтвердження адміністратора.')
          }
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          loginAttempts.recordFail(email)
          return null
        }

        // Успішний вхід — скидаємо лічильник
        loginAttempts.reset(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        // Додаємо clientId для клієнтів
        if ((user as any).role === 'CLIENT') {
          const client = await prisma.client.findFirst({ where: { userId: user.id } })
          token.clientId = client?.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
        ;(session.user as any).clientId = token.clientId
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
    maxAge: 24 * 60 * 60, // 24 години
  },
  secret: process.env.NEXTAUTH_SECRET,
}
