import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCampaigns, getAdSets } from '@/lib/meta'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const adAccountId = searchParams.get('adAccountId')
  const from = searchParams.get('from') ?? (() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0] })()
  const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0]
  if (!adAccountId) return NextResponse.json({ error: 'Missing adAccountId' }, { status: 400 })
  try {
    const [campaigns, adsets] = await Promise.all([getCampaigns(adAccountId, from, to), getAdSets(adAccountId, from, to)])
    return NextResponse.json({ campaigns, adsets })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
