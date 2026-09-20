import { NextRequest, NextResponse } from 'next/server'
import { getUsdRates, conversionRate } from '@/lib/exchange-rates'

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? 'USD'
  const to = request.nextUrl.searchParams.get('to') ?? 'USD'

  if (from === to) return NextResponse.json({ rate: 1, from, to })

  const rates = await getUsdRates()
  return NextResponse.json({ rate: conversionRate(from, to, rates), from, to })
}
