'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Platform='FACEBOOK'|'GOOGLE'|'TIKTOK'
interface AdAccountForm { name:string; accountId:string; platform:Platform }

const inp = { width:'100%', padding:'11px 14px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s, box-shadow 0.2s' }
const lbl = { display:'block', fontSize:'10px', fontWeight:600 as const, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'var(--text3)', marginBottom:'7px' }

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({name:'',company:'',email:'',password:''})
  const [adAccounts, setAdAccounts] = useState<AdAccountForm[]>([{name:'',accountId:'',platform:'FACEBOOK'}])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const addAccount = () => setAdAccounts([...adAccounts, {name:'',accountId:'',platform:'FACEBOOK'}])
  const removeAccount = (i: number) => setAdAccounts(adAccounts.filter((_,idx)=>idx!==i))
  const updateAccount = (i: number, field: keyof AdAccountForm, value: string) => {
    const u = [...adAccounts]; u[i] = {...u[i],[field]:value}; setAdAccounts(u)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const res = await fetch('/api/clients', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, adAccounts})})
    if (res.ok) router.push('/admin/clients')
    else { const d = await res.json(); setError(d.error ?? 'Помилка'); setLoading(false) }
  }

  const section = { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '16px' : '24px', marginBottom:'14px' }
  const sectionTitle = { fontSize:'10px', fontWeight:700 as const, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'var(--text3)', margin:'0 0 20px' }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ marginBottom: isMobile ? '20px' : '32px' }}>
            <Link href="/admin/clients" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text3)', textDecoration:'none', marginBottom:'16px' }}>
              <ArrowLeft size={13}/>Назад до клієнтів
            </Link>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// НОВИЙ КЛІЄНТ</p>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Додати клієнта</h1>
            {!isMobile && <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Заповніть дані та прив&apos;яжіть рекламні кабінети</p>}
          </div>

          <form onSubmit={handleSubmit} className="anim-up-1">
            {/* Основна інформація */}
            <div style={section}>
              <p style={sectionTitle}>Основна інформація</p>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <div>
                  <label style={lbl}>Ім&apos;я</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Іван Петренко" required style={inp}
                    onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                </div>
                <div>
                  <label style={lbl}>Компанія</label>
                  <input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="ТОВ Компанія" required style={inp}
                    onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                  />
                </div>
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label style={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@company.com" required style={inp}
                  onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                />
              </div>
              <div>
                <label style={lbl}>Пароль</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Мінімум 8 символів" required minLength={8} style={inp}
                  onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                />
              </div>
            </div>

            {/* Рекламні кабінети */}
            <div style={section}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                <p style={{ ...sectionTitle, margin:0 }}>Рекламні кабінети</p>
                <button type="button" onClick={addAccount} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:'6px', color:'var(--text3)', fontSize:'12px', cursor:'pointer' }}>
                  <Plus size={13}/>Додати
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {adAccounts.map((acc, i) => (
                  <div key={i} style={{ background:'var(--bg)', borderRadius:'8px', padding:'12px', border:'1px solid var(--border)' }}>
                    {/* Заголовок рядка */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, color:'var(--text3)', fontFamily:'monospace' }}>Кабінет #{i+1}</span>
                      <button type="button" onClick={()=>removeAccount(i)} disabled={adAccounts.length===1}
                        style={{ padding:'4px', background:'transparent', border:'none', color:'var(--text4)', cursor: adAccounts.length===1 ? 'not-allowed' : 'pointer', opacity: adAccounts.length===1 ? 0.3 : 1 }}
                        onMouseEnter={e=>{ if(adAccounts.length>1) e.currentTarget.style.color='#ff4444' }}
                        onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.2)' }}
                      ><Trash2 size={14}/></button>
                    </div>

                    {/* Поля */}
                    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:'10px' }}>
                      <div>
                        <label style={lbl}>Платформа</label>
                        <select value={acc.platform} onChange={e=>updateAccount(i,'platform',e.target.value)}
                          style={{ ...inp, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23555' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' }}>
                          <option value="FACEBOOK">Facebook / Meta</option>
                          <option value="GOOGLE">Google Ads</option>
                          <option value="TIKTOK">TikTok Ads</option>
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>ID кабінету</label>
                        <input value={acc.accountId} onChange={e=>updateAccount(i,'accountId',e.target.value)} placeholder="act_123456" required style={inp}
                          onFocus={e=>{e.target.style.borderColor='#e60000'}}
                          onBlur={e=>{e.target.style.borderColor='var(--border)'}}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Назва</label>
                        <input value={acc.name} onChange={e=>updateAccount(i,'name',e.target.value)} placeholder="Основний" required style={inp}
                          onFocus={e=>{e.target.style.borderColor='#e60000'}}
                          onBlur={e=>{e.target.style.borderColor='var(--border)'}}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px', marginBottom:'14px' }}>
                <AlertCircle size={14} style={{flexShrink:0}}/>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px', background: loading ? '#333' : '#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s' }}
              onMouseEnter={e=>{ if(!loading){e.currentTarget.style.background='#cc0000';e.currentTarget.style.boxShadow='0 4px 24px rgba(230,0,0,0.35)'}}}
              onMouseLeave={e=>{ e.currentTarget.style.background='#e60000';e.currentTarget.style.boxShadow='none' }}
            >
              {loading ? <><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Створюємо...</> : 'Створити клієнта →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
