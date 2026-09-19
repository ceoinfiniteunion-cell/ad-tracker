import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? 'USD'
  const to = request.nextUrl.searchParams.get('to') ?? 'USD'

  if (from === to) return NextResponse.json({ rate: 1, from, to })

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const rates: Record<string, number> = data.rates ?? {}
    // rates are relative to USD; rates['USD'] = 1 implicitly
    const rateFrom = from === 'USD' ? 1 : (rates[from] ?? 1)
    const rateTo = to === 'USD' ? 1 : (rates[to] ?? 1)
    return NextResponse.json({ rate: rateTo / rateFrom, from, to })
  } catch {
    return NextResponse.json({ rate: 1, from, to })
  }
}
