import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/clients — список клиентов (только для admin)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const clients = await prisma.client.findMany({
    include: {
      user: { select: { email: true, name: true, createdAt: true } },
      adAccounts: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clients)
}

// POST /api/clients — создать клиента (только для admin)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, company, email, password, adAccounts } = body

  if (!name || !company || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const client = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'CLIENT',
      client: {
        create: {
          name,
          company,
          adAccounts: {
            create: (adAccounts ?? []).map((acc: any) => ({
              name: acc.name,
              accountId: acc.accountId,
              platform: acc.platform,
            })),
          },
        },
      },
    },
    include: { client: { include: { adAccounts: true } } },
  })

  return NextResponse.json(client, { status: 201 })
}
