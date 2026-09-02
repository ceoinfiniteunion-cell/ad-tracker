import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to') ?? 'USD'
  
  if (to === 'USD') return NextResponse.json({ rate: 1, from: 'USD', to: 'USD' })

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`, { next: { revalidate: 3600 } })
    const data = await res.json()
    const rate = data.rates?.[to] ?? 1
    return NextResponse.json({ rate, from: 'USD', to })
  } catch {
    return NextResponse.json({ rate: 1, from: 'USD', to })
  }
}
