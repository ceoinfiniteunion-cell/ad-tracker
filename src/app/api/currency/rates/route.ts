import { NextResponse } from 'next/server'
import { getUsdRates } from '@/lib/exchange-rates'

export async function GET() {
  const rates = await getUsdRates()
  return NextResponse.json({
    base: 'USD',
    rates,
    updatedAt: new Date().toISOString(),
  })
}
