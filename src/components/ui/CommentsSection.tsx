'use client'
import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Trash2, X } from 'lucide-react'

interface Comment { id: string; text: string; period?: string; createdAt: string; authorId: string }

interface Props {
  clientId: string
  isAdmin?: boolean
}

export function CommentsSection({ clientId, isAdmin }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [period, setPeriod] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/comments?clientId=${clientId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setComments(d) })
  }, [clientId])

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, text, period })
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [c, ...prev])
      setText(''); setPeriod(''); setShowForm(false)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('uk', { day:'2-digit', month:'short', year:'numeric' })

  return (
    <div style={{ marginBottom:'28px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.12em', color:'var(--text4)', margin:0 }}>// КОМЕНТАРІ АГЕНТСТВА</p>
          {comments.length > 0 && <span style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text4)', background:'var(--bg3)', padding:'2px 6px', borderRadius:'4px' }}>{comments.length}</span>}
        </div>
        {isAdmin && (
          <button onClick={()=>setShowForm(!showForm)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'var(--accent2)', border:'1px solid var(--accent3)', borderRadius:'7px', color:'var(--accent)', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
            <Plus size={12}/> Додати коментар
          </button>
        )}
      </div>

      {/* Форма додавання (тільки для адміна) */}
      {isAdmin && showForm && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'12px', padding:'16px', marginBottom:'12px' }}>
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="Напишіть коментар для клієнта..."
            rows={3}
            style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' as const }}
          />
          <div style={{ display:'flex', gap:'8px', marginTop:'10px', alignItems:'center' }}>
            <input
              value={period}
              onChange={e=>setPeriod(e.target.value)}
              placeholder="Період (напр. Липень 2026)"
              style={{ flex:1, padding:'8px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'12px', outline:'none' }}
            />
            <button onClick={handleAdd} disabled={saving || !text.trim()}
              style={{ padding:'8px 16px', background:'#e60000', color:'#fff', fontSize:'12px', fontWeight:700, borderRadius:'8px', border:'none', cursor: saving||!text.trim()?'not-allowed':'pointer', opacity: saving||!text.trim()?0.6:1 }}>
              {saving ? 'Зберігаємо...' : 'Додати'}
            </button>
            <button onClick={()=>{ setShowForm(false); setText(''); setPeriod('') }}
              style={{ padding:'8px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer', color:'var(--text3)' }}>
              <X size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* Список коментарів */}
      {comments.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px dashed var(--border)', borderRadius:'12px', padding:'20px', textAlign:'center' }}>
          <MessageSquare size={20} style={{ color:'var(--text4)', margin:'0 auto 8px' }}/>
          <p style={{ fontSize:'13px', color:'var(--text4)', margin:0 }}>Коментарів ще немає</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px', position:'relative' }}>
              {isAdmin && (
                <button onClick={()=>handleDelete(c.id)}
                  style={{ position:'absolute', top:'10px', right:'10px', background:'none', border:'none', cursor:'pointer', color:'var(--text4)', padding:'2px' }}
                  onMouseEnter={e=>{ e.currentTarget.style.color='#ff4444' }}
                  onMouseLeave={e=>{ e.currentTarget.style.color='var(--text4)' }}
                >
                  <Trash2 size={12}/>
                </button>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:'rgba(230,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#e60000' }}>A</span>
                </div>
                <span style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)' }}>Infinite Union</span>
                {c.period && <span style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', background:'var(--bg3)', padding:'2px 6px', borderRadius:'4px' }}>{c.period}</span>}
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text4)', marginLeft:'auto' }}>{formatDate(c.createdAt)}</span>
              </div>
              <p style={{ fontSize:'13px', color:'var(--text)', margin:0, lineHeight:1.6 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
