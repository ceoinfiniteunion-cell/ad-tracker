import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sealToken, stripTokens } from '@/lib/token-store'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = (session.user as any).clientId
  if (!clientId) return NextResponse.json({ error: 'Not a client' }, { status: 403 })
  const account = await prisma.adAccount.findFirst({ where: { id: params.id, clientId } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const accessToken: string | undefined = body.accessToken
  const newAccountId: string | undefined = body.accountId
  const newName: string | undefined = body.name

  let tokenStatus = account.tokenStatus ?? 'no_token'
  if (accessToken && account.platform === 'FACEBOOK') {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/act_${account.accountId.replace('act_','')}?fields=id,name&access_token=${accessToken}`)
      const d = await res.json()
      tokenStatus = d.error ? 'invalid' : 'valid'
    } catch { tokenStatus = 'invalid' }
  }

  const updated = await prisma.adAccount.update({
    where: { id: params.id },
    data: {
      ...(accessToken !== undefined ? { accessToken: sealToken(accessToken), tokenStatus } : {}),
      ...(newAccountId ? { accountId: newAccountId } : {}),
      ...(newName ? { name: newName } : {}),
    }
  })
  return NextResponse.json(stripTokens(updated))
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clientId = (session.user as any).clientId
  const isAdmin = (session.user as any).role === 'ADMIN'
  if (!isAdmin && !clientId) return NextResponse.json({ error: 'Not a client' }, { status: 403 })
  const account = await prisma.adAccount.findFirst({ where: { id: params.id, ...(isAdmin ? {} : { clientId }) } })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.adAccount.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
