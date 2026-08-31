import { prisma } from './prisma'

type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'CLIENT_APPROVED'
  | 'CLIENT_REJECTED'
  | 'TOKEN_SAVED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'

export async function audit(action: AuditAction, userId: string | null, meta?: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId ?? 'system',
        meta: meta ?? {},
      },
    })
  } catch (e) {
    console.error('[AUDIT ERROR]', e)
  }
}
