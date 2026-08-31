import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from './prisma'
import { isTokenBlacklisted } from './jwt-blacklist'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/auth/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { client: true },
        })

        if (!user) {
          await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED', userId: 'unknown', meta: { email: credentials.email, reason: 'user_not_found' } } }).catch(() => {})
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED', userId: user.id, meta: { email: user.email, reason: 'wrong_password' } } }).catch(() => {})
          return null
        }

        if (user.status === 'PENDING') {
          await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED', userId: user.id, meta: { reason: 'pending' } } }).catch(() => {})
          throw new Error('PENDING')
        }
        if (user.status === 'REJECTED') {
          await prisma.auditLog.create({ data: { action: 'LOGIN_FAILED', userId: user.id, meta: { reason: 'rejected' } } }).catch(() => {})
          throw new Error('REJECTED')
        }

        await prisma.auditLog.create({ data: { action: 'LOGIN_SUCCESS', userId: user.id, meta: { email: user.email, role: user.role } } }).catch(() => {})

        return { id: user.id, email: user.email, name: user.name, role: user.role, clientId: user.client?.id ?? null }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.clientId = (user as any).clientId
        token.jti = crypto.randomUUID()
      }
      return token
    },
    async session({ session, token }) {
      // Перевіряємо blacklist
      if (token.jti) {
        const blacklisted = await isTokenBlacklisted(token.jti as string)
        if (blacklisted) throw new Error('Token revoked')
      }

      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).clientId = token.clientId
      }
      return session
    },
  },
}
