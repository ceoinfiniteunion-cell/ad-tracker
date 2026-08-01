'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Users, TrendingUp, DollarSign, MousePointer, ArrowRight } from 'lucide-react'

interface ClientSummary {
  id: string
  name: string
  company: string
  email: string
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  ctr: number
  roas: number
  platforms: string[]
}

const PCOLOR: Record<string,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }
const PLABEL: Record<string,string> = { FACEBOOK:'Meta', GOOGLE:'Google', TIKTOK:'TikTok' }

export default function AdminDashboardPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [sortBy, setSortBy] = useState<'spend'|'roas'|'clicks'>('spend')

  useEffect(() => {
    setLoading(true)
    const from = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]

    fetch('/api/clients/list').then(r=>r.json()).then(async (clientList: any[]) => {
      const summaries = await Promise.all(clientList.map(async (c) => {
        try {
          const res = await fetch(`/api/metrics?clientId=${c.id}&from=${from}&to=${to}`)
          const data = await res.json()
          const t = data.totals ?? {}
          const platforms = Array.from(new Set((data.platforms ?? []).map((p: any) => p.platform))) as string[]
          return {
            id: c.id,
            name: c.name,
            company: c.company,
            email: c.user?.email ?? '',
            totalSpend: t.totalSpend ?? 0,
            totalImpressions: t.totalImpressions ?? 0,
            totalClicks: t.totalClicks ?? 0,
            totalConversions: t.totalConversions ?? 0,
            totalRevenue: t.totalRevenue ?? 0,
            ctr: t.ctr ?? 0,
            roas: t.roas ?? 0,
            platforms,
          }
        } catch {
          return { id:c.id, name:c.name, company:c.company, email:'', totalSpend:0, totalImpressions:0, totalClicks:0, totalConversions:0, totalRevenue:0, ctr:0, roas:0, platforms:[] }
        }
      }))
      setClients(summaries)
      setLoading(false)
    })
  }, [period])

  const sorted = [...clients].sort((a, b) => {
    if (sortBy === 'spend') return b.totalSpend - a.totalSpend
    if (sortBy === 'roas') return b.roas - a.roas
    return b.totalClicks - a.totalClicks
  })

  const totalSpend = clients.reduce((s, c) => s + c.totalSpend, 0)
  const totalRevenue = clients.reduce((s, c) => s + c.totalRevenue, 0)
  const totalClicks = clients.reduce((s, c) => s + c.totalClicks, 0)
  const totalConversions = clients.reduce((s, c) => s + c.totalConversions, 0)

  const tabStyle = (active: boolean) => ({
    padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? 'rgba(230,0,0,0.12)' : 'transparent',
    color: active ? '#ff4444' : 'var(--text3)',
    borderColor: active ? 'rgba(230,0,0,0.3)' : 'var(--border)',
  })

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        

        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom:'32px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text4)', marginBottom:'8px' }}>// АДМІН · ОГЛЯД</p>
            <h1 style={{ fontSize:'26px', fontWeight:800, color:'var(--text)', margin:0 }}>Всі клієнти</h1>
            <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Зведена аналітика по всіх рекламних кабінетах</p>
          </div>

          {/* Фільтри */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
            <div style={{ display:'flex', gap:'6px' }}>
              {[7,14,30,90].map(d => (
                <button key={d} onClick={()=>setPeriod(d)} style={tabStyle(period===d)}>{d} днів</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'var(--text3)' }}>Сортувати:</span>
              {[{k:'spend',l:'Витрати'},{k:'roas',l:'ROAS'},{k:'clicks',l:'Кліки'}].map(s => (
                <button key={s.k} onClick={()=>setSortBy(s.k as any)} style={tabStyle(sortBy===s.k)}>{s.l}</button>
              ))}
            </div>
          </div>

          {/* Загальні метрики */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'28px' }}>
            {[
              { label:'Загальні витрати', value:formatCurrency(totalSpend), icon:DollarSign, color:'#e60000' },
              { label:'Загальний дохід', value:formatCurrency(totalRevenue), icon:TrendingUp, color:'#00c864' },
              { label:'Кліки', value:formatNumber(totalClicks), icon:MousePointer, color:'var(--text)' },
              { label:'Конверсії', value:formatNumber(totalConversions), icon:Users, color:'#00c864' },
            ].map(m => (
              <div key={m.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
                <p style={{ fontSize:'20px', fontWeight:800, fontFamily:'monospace', color:m.color, margin:0 }}>{m.value}</p>
                <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Список клієнтів */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:'16px', flexDirection:'column' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)' }}>Завантаження даних клієнтів...</p>
            </div>
          ) : (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
              {/* Заголовок таблиці */}
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'center' }}>
                {['Клієнт','Витрати','Дохід','Кліки','Конверсії','ROAS',''].map((h,i) => (
                  <p key={i} style={{ fontFamily:'monospace', fontSize:'10px', fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{h}</p>
                ))}
              </div>

              {/* Рядки клієнтів */}
              {sorted.map((c, i) => (
                <div key={c.id}
                  style={{ padding:'16px 20px', borderBottom: i < sorted.length-1 ? '1px solid var(--border)' : 'none', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'center', cursor:'pointer', transition:'background 0.15s' }}
                  onClick={()=>router.push(`/admin/stats?client=${c.id}`)}
                  onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg3)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                >
                  {/* Клієнт */}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'13px', fontWeight:800, color:'#e60000' }}>{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>{c.name}</p>
                      <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                        {c.platforms.map(pl => (
                          <span key={pl} style={{ fontFamily:'monospace', fontSize:'9px', padding:'1px 5px', borderRadius:'3px', background:`${PCOLOR[pl]}15`, color:PCOLOR[pl], fontWeight:700 }}>
                            {PLABEL[pl]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Метрики */}
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#e60000', margin:0 }}>{formatCurrency(c.totalSpend)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:600, color:'#00c864', margin:0 }}>{formatCurrency(c.totalRevenue)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', margin:0 }}>{formatNumber(c.totalClicks)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', margin:0 }}>{formatNumber(c.totalConversions)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color: c.roas>=2?'#00c864':c.roas>=1?'#fbbf24':'#ff4444', margin:0 }}>{c.roas.toFixed(2)}×</p>

                  {/* Кнопка */}
                  <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text3)', fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap' as const }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(230,0,0,0.3)'; e.currentTarget.style.color='#ff4444' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
                  >
                    Деталі <ArrowRight size={11}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
