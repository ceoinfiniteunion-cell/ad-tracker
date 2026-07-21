import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdAccounts } from '@/lib/meta'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const accounts = await getAdAccounts()
    return NextResponse.json(accounts)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
