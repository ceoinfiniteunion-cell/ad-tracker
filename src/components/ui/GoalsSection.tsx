'use client'
import { useEffect, useState } from 'react'
import { Target, Plus, Trash2, X } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

const METRIC_OPTIONS = [
  { value:'spend', label:'Витрати', unit:'$' },
  { value:'conversions', label:'Конверсії', unit:'#' },
  { value:'clicks', label:'Кліки', unit:'#' },
  { value:'leads', label:'Ліди', unit:'#' },
  { value:'roas', label:'ROAS', unit:'x' },
  { value:'ctr', label:'CTR', unit:'%' },
]

const PERIOD_OPTIONS = [
  { value:'monthly', label:'Місяць' },
  { value:'weekly', label:'Тиждень' },
]

function formatVal(metric: string, val: number) {
  if (metric === 'spend') return formatCurrency(val)
  if (metric === 'ctr') return formatPercent(val)
  if (metric === 'roas') return `${val.toFixed(2)}×`
  return formatNumber(val)
}

function getCurrentVal(metric: string, totals: any): number {
  switch(metric) {
    case 'spend': return totals?.totalSpend ?? 0
    case 'conversions': return totals?.totalConversions ?? 0
    case 'clicks': return totals?.totalClicks ?? 0
    case 'leads': return totals?.totalLeads ?? 0
    case 'roas': return totals?.roas ?? 0
    case 'ctr': return totals?.ctr ?? 0
    default: return 0
  }
}

interface Props { totals: any; clientId?: string }

export function GoalsSection({ totals, clientId }: Props) {
  const [goals, setGoals] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ metric:'spend', target:'', period:'monthly', label:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const url = clientId ? `/api/goals?clientId=${clientId}` : '/api/goals'
    fetch(url).then(r=>{ if(r.ok) return r.json(); return [] }).then(d=>{ if(Array.isArray(d)) setGoals(d) }).catch(()=>{})
  }, [clientId])

  const handleAdd = async () => {
    if (!form.target) return
    setSaving(true)
    try {
    const res = await fetch('/api/goals', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, clientId })
    })
    if (res.ok) {
      const g = await res.json()
      setGoals(prev => [g, ...prev])
      setShowModal(false)
      setForm({ metric:'spend', target:'', period:'monthly', label:'' })
    }
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/goals?id=${id}`, { method:'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  if (goals.length === 0 && !showModal) return (
    <div style={{ marginBottom:'28px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', margin:0 }}>// ЦІЛІ</p>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'var(--accent2)', border:'1px solid var(--accent3)', borderRadius:'7px', color:'var(--accent)', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
          <Plus size={12}/> Додати ціль
        </button>
      </div>
      <div style={{ background:'var(--bg2)', border:'1px dashed var(--border2)', borderRadius:'12px', padding:'24px', textAlign:'center' }}>
        <Target size={24} style={{ color:'var(--text4)', margin:'0 auto 8px' }}/>
        <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Цілі не задані — додайте першу ціль</p>
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom:'28px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', margin:0 }}>// ЦІЛІ</p>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'var(--accent2)', border:'1px solid var(--accent3)', borderRadius:'7px', color:'var(--accent)', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
          <Plus size={12}/> Додати ціль
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'12px' }}>
        {goals.map(goal => {
          const current = getCurrentVal(goal.metric, totals)
          const pct = Math.min((current / goal.target) * 100, 100)
          const done = pct >= 100
          const metaInfo = METRIC_OPTIONS.find(m => m.value === goal.metric)
          const color = done ? '#00c864' : pct >= 70 ? '#fbbf24' : 'var(--accent)'

          return (
            <div key={goal.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px', position:'relative' }}>
              <button onClick={()=>handleDelete(goal.id)} style={{ position:'absolute', top:'12px', right:'12px', background:'none', border:'none', cursor:'pointer', color:'var(--text4)', padding:'2px' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#ff4444' }}
                onMouseLeave={e=>{ e.currentTarget.style.color='var(--text4)' }}
              >
                <Trash2 size={12}/>
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                <Target size={14} style={{ color }} />
                <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text)', margin:0 }}>
                  {goal.label || metaInfo?.label}
                </p>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', background:'var(--bg3)', padding:'2px 6px', borderRadius:'4px' }}>
                  {PERIOD_OPTIONS.find(p=>p.value===goal.period)?.label}
                </span>
              </div>

              {/* Прогрес бар */}
              <div style={{ marginBottom:'8px' }}>
                <div style={{ height:'6px', background:'var(--bg3)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background: color, borderRadius:'3px', transition:'width 0.5s ease' }}/>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <p style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:800, color, margin:0 }}>
                  {formatVal(goal.metric, current)}
                </p>
                <p style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text3)', margin:0 }}>
                  з {formatVal(goal.metric, goal.target)} · {pct.toFixed(0)}%
                </p>
              </div>

              {done && (
                <div style={{ marginTop:'8px', padding:'4px 10px', background:'rgba(0,200,100,0.1)', border:'1px solid rgba(0,200,100,0.2)', borderRadius:'6px', fontSize:'11px', fontWeight:700, color:'#00c864', textAlign:'center' }}>
                  ✓ Ціль досягнута!
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Модальне вікно */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'16px', padding:'28px', width:'360px', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'16px', fontWeight:800, color:'var(--text)', margin:0 }}>Нова ціль</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={16}/></button>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Показник</label>
              <select value={form.metric} onChange={e=>setForm({...form,metric:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none' }}>
                {METRIC_OPTIONS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Ціль</label>
              <input type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}
                placeholder="напр. 10000"
                style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', boxSizing:'border-box' as const }}
              />
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Період</label>
              <select value={form.period} onChange={e=>setForm({...form,period:e.target.value})}
                style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none' }}>
                {PERIOD_OPTIONS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Назва (необов'язково)</label>
              <input value={form.label} onChange={e=>setForm({...form,label:e.target.value})}
                placeholder="напр. Ціль на липень"
                style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', boxSizing:'border-box' as const }}
              />
            </div>

            <button onClick={handleAdd} disabled={saving || !form.target}
              style={{ width:'100%', padding:'12px', background:'#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: saving||!form.target?'not-allowed':'pointer', opacity: saving||!form.target?0.6:1 }}>
              {saving ? 'Зберігаємо...' : 'Додати ціль →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
