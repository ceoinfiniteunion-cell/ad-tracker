import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      db: 'disconnected',
      error: e.message,
    }, { status: 503 })
  }
}
