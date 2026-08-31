'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Users, TrendingUp, DollarSign, MousePointer, ArrowRight } from 'lucide-react'

interface ClientSummary {
  id: string; name: string; company: string; email: string
  totalSpend: number; totalImpressions: number; totalClicks: number
  totalConversions: number; totalRevenue: number; ctr: number; roas: number; platforms: string[]
}

const PCOLOR: Record<string,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#555' }
const PLABEL: Record<string,string> = { FACEBOOK:'Meta', GOOGLE:'Google', TIKTOK:'TikTok' }

export default function AdminDashboardPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)
  const [sortBy, setSortBy] = useState<'spend'|'roas'|'clicks'>('spend')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setLoading(true)
    const from = new Date(Date.now() - period * 86400000).toISOString().split('T')[0]
    const to = new Date().toISOString().split('T')[0]
    fetch('/api/clients/list').then(r=>r.json()).then(async (clientList: any[]) => {
      const summaries = await Promise.all(clientList.map(async (c) => {
        try {
          const res = await fetch(`/api/metrics?clientId=${c.id}&from=${from}&to=${to}`)
          const data = await res.json()
          const t = data.totals ?? {}
          const platforms = Array.from(new Set((data.platforms ?? []).map((p: any) => p.platform))) as string[]
          return { id:c.id, name:c.name, company:c.company, email:c.user?.email??'', totalSpend:t.totalSpend??0, totalImpressions:t.totalImpressions??0, totalClicks:t.totalClicks??0, totalConversions:t.totalConversions??0, totalRevenue:t.totalRevenue??0, ctr:t.ctr??0, roas:t.roas??0, platforms }
        } catch {
          return { id:c.id, name:c.name, company:c.company, email:'', totalSpend:0, totalImpressions:0, totalClicks:0, totalConversions:0, totalRevenue:0, ctr:0, roas:0, platforms:[] }
        }
      }))
      setClients(summaries)
      setLoading(false)
    })
  }, [period])

  const sorted = [...clients].sort((a,b) => sortBy==='spend'?b.totalSpend-a.totalSpend:sortBy==='roas'?b.roas-a.roas:b.totalClicks-a.totalClicks)
  const totalSpend = clients.reduce((s,c)=>s+c.totalSpend,0)
  const totalRevenue = clients.reduce((s,c)=>s+c.totalRevenue,0)
  const totalClicks = clients.reduce((s,c)=>s+c.totalClicks,0)
  const totalConversions = clients.reduce((s,c)=>s+c.totalConversions,0)

  const tabStyle = (active: boolean) => ({
    padding: isMobile ? '6px 10px' : '7px 14px',
    borderRadius:'7px', fontSize: isMobile ? '11px' : '12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? 'rgba(230,0,0,0.12)' : 'transparent',
    color: active ? '#ff4444' : 'var(--text3)',
    borderColor: active ? 'rgba(230,0,0,0.3)' : 'var(--border)',
  })

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom: isMobile ? '20px' : '32px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text4)', marginBottom:'8px' }}>// АДМІН · ОГЛЯД</p>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Всі клієнти</h1>
            <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Зведена аналітика по всіх рекламних кабінетах</p>
          </div>

          {/* Фільтри */}
          <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', marginBottom:'20px', gap:'10px' }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {[7,14,30,90].map(d => (
                <button key={d} onClick={()=>setPeriod(d)} style={tabStyle(period===d)}>{d} днів</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', color:'var(--text3)' }}>Сортувати:</span>
              {[{k:'spend',l:'Витрати'},{k:'roas',l:'ROAS'},{k:'clicks',l:'Кліки'}].map(s => (
                <button key={s.k} onClick={()=>setSortBy(s.k as any)} style={tabStyle(sortBy===s.k)}>{s.l}</button>
              ))}
            </div>
          </div>

          {/* Загальні метрики */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:'10px', marginBottom:'24px' }}>
            {[
              { label:'Загальні витрати', value:formatCurrency(totalSpend), color:'#e60000' },
              { label:'Загальний дохід', value:formatCurrency(totalRevenue), color:'#00c864' },
              { label:'Кліки', value:formatNumber(totalClicks), color:'var(--text)' },
              { label:'Конверсії', value:formatNumber(totalConversions), color:'#00c864' },
            ].map(m => (
              <div key={m.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '14px' : '18px 20px' }}>
                <p style={{ fontSize: isMobile ? '18px' : '20px', fontWeight:800, fontFamily:'monospace', color:m.color, margin:0 }}>{m.value}</p>
                <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'5px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Список клієнтів */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:'16px', flexDirection:'column' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)' }}>Завантаження...</p>
            </div>
          ) : isMobile ? (
            /* МОБІЛЬНІ КАРТКИ */
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {sorted.map((c) => (
                <div key={c.id}
                  onClick={()=>router.push(`/admin/stats?client=${c.id}`)}
                  style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', cursor:'pointer', transition:'background 0.15s' }}
                  onTouchStart={e=>{ e.currentTarget.style.background='var(--bg3)' }}
                  onTouchEnd={e=>{ e.currentTarget.style.background='var(--bg2)' }}
                >
                  {/* Клієнт хедер */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'14px', fontWeight:800, color:'#e60000' }}>{c.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', margin:0 }}>{c.name}</p>
                        <div style={{ display:'flex', gap:'4px', marginTop:'3px' }}>
                          {c.platforms.map(pl => (
                            <span key={pl} style={{ fontFamily:'monospace', fontSize:'9px', padding:'1px 5px', borderRadius:'3px', background:`${PCOLOR[pl]}15`, color:PCOLOR[pl], fontWeight:700 }}>{PLABEL[pl]}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--text4)"/>
                  </div>

                  {/* Метрики 2x2 */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[
                      { label:'Витрати', value:formatCurrency(c.totalSpend), color:'#e60000' },
                      { label:'Дохід', value:formatCurrency(c.totalRevenue), color:'#00c864' },
                      { label:'Кліки', value:formatNumber(c.totalClicks), color:'var(--text2)' },
                      { label:'ROAS', value:`${c.roas.toFixed(2)}×`, color:c.roas>=2?'#00c864':c.roas>=1?'#fbbf24':'#ff4444' },
                    ].map(m => (
                      <div key={m.label} style={{ background:'var(--bg)', borderRadius:'8px', padding:'10px 12px' }}>
                        <p style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:700, color:m.color, margin:0 }}>{m.value}</p>
                        <p style={{ fontSize:'10px', color:'var(--text4)', margin:'3px 0 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ДЕСКТОП ТАБЛИЦЯ */
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'center' }}>
                {['Клієнт','Витрати','Дохід','Кліки','Конверсії','ROAS',''].map((h,i) => (
                  <p key={i} style={{ fontFamily:'monospace', fontSize:'10px', fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{h}</p>
                ))}
              </div>
              {sorted.map((c,i) => (
                <div key={c.id}
                  style={{ padding:'16px 20px', borderBottom:i<sorted.length-1?'1px solid var(--border)':'none', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr auto', gap:'12px', alignItems:'center', cursor:'pointer', transition:'background 0.15s' }}
                  onClick={()=>router.push(`/admin/stats?client=${c.id}`)}
                  onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg3)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:'13px', fontWeight:800, color:'#e60000' }}>{c.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'var(--text)', margin:0 }}>{c.name}</p>
                      <div style={{ display:'flex', gap:'4px', marginTop:'4px' }}>
                        {c.platforms.map(pl => (
                          <span key={pl} style={{ fontFamily:'monospace', fontSize:'9px', padding:'1px 5px', borderRadius:'3px', background:`${PCOLOR[pl]}15`, color:PCOLOR[pl], fontWeight:700 }}>{PLABEL[pl]}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#e60000', margin:0 }}>{formatCurrency(c.totalSpend)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:600, color:'#00c864', margin:0 }}>{formatCurrency(c.totalRevenue)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', margin:0 }}>{formatNumber(c.totalClicks)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'var(--text2)', margin:0 }}>{formatNumber(c.totalConversions)}</p>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:c.roas>=2?'#00c864':c.roas>=1?'#fbbf24':'#ff4444', margin:0 }}>{c.roas.toFixed(2)}×</p>
                  <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text3)', fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap' as const }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(230,0,0,0.3)'; e.currentTarget.style.color='#ff4444' }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
                  >Деталі <ArrowRight size={11}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
