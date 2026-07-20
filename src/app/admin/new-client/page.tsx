'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Plus, Trash2, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Platform='FACEBOOK'|'GOOGLE'|'TIKTOK'
interface AdAccountForm { name:string; accountId:string; platform:Platform }

const inp = { width:'100%', padding:'11px 14px', background:'#161616', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, transition:'border-color 0.2s, box-shadow 0.2s' }
const lbl = { display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', marginBottom:'7px' }

export default function NewClientPage() {
  const router=useRouter()
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [form,setForm]=useState({name:'',company:'',email:'',password:''})
  const [adAccounts,setAdAccounts]=useState<AdAccountForm[]>([{name:'',accountId:'',platform:'FACEBOOK'}])

  const addAccount=()=>setAdAccounts([...adAccounts,{name:'',accountId:'',platform:'FACEBOOK'}])
  const removeAccount=(i:number)=>setAdAccounts(adAccounts.filter((_,idx)=>idx!==i))
  const updateAccount=(i:number,field:keyof AdAccountForm,value:string)=>{ const u=[...adAccounts]; u[i]={...u[i],[field]:value}; setAdAccounts(u) }

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError('')
    const res=await fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,adAccounts})})
    if(res.ok) router.push('/admin/clients')
    else { const d=await res.json(); setError(d.error??'Помилка'); setLoading(false) }
  }

  const section = { background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px', marginBottom:'14px' }
  const sectionTitle = { fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'rgba(255,255,255,0.35)', margin:'0 0 20px' }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none', zIndex:0 }} />
        <div style={{ maxWidth:'680px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ marginBottom:'32px' }}>
            <Link href="/admin/clients" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.3)', textDecoration:'none', marginBottom:'20px', transition:'color 0.15s' }}>
              <ArrowLeft size={13}/>Назад до клієнтів
            </Link>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// НОВИЙ КЛІЄНТ</p>
            <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Додати клієнта</h1>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Заповніть дані та прив'яжіть рекламні кабінети</p>
          </div>

          <form onSubmit={handleSubmit} className="anim-up-1">
            <div style={section}>
              <p style={sectionTitle}>Основна інформація</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
                <div><label style={lbl}>Ім'я</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Іван Петренко" required style={inp} onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}} /></div>
                <div><label style={lbl}>Компанія</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="ТОВ Компанія" required style={inp} onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}} /></div>
              </div>
              <div style={{ marginBottom:'14px' }}><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="client@company.com" required style={inp} onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}} /></div>
              <div><label style={lbl}>Пароль</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Мінімум 8 символів" required minLength={8} style={inp} onFocus={e=>{e.target.style.borderColor='#e60000';e.target.style.boxShadow='0 0 0 3px rgba(230,0,0,0.12)'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none'}} /></div>
            </div>

            <div style={section}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
                <p style={{ ...sectionTitle, margin:0 }}>Рекламні кабінети</p>
                <button type="button" onClick={addAccount} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'6px', color:'rgba(255,255,255,0.4)', fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>{ (e.currentTarget).style.borderColor='rgba(230,0,0,0.3)'; (e.currentTarget).style.color='#ff4444' }}
                  onMouseLeave={e=>{ (e.currentTarget).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget).style.color='rgba(255,255,255,0.4)' }}
                >
                  <Plus size={13}/>Додати
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {adAccounts.map((acc,i)=>(
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'10px', alignItems:'end' }}>
                    <div><label style={lbl}>Платформа</label>
                      <select value={acc.platform} onChange={e=>updateAccount(i,'platform',e.target.value)} style={{ ...inp, backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23555' d='M5 7L1 3h8z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' }}>
                        <option value="FACEBOOK">Facebook / Meta</option>
                        <option value="GOOGLE">Google Ads</option>
                        <option value="TIKTOK">TikTok Ads</option>
                      </select>
                    </div>
                    <div><label style={lbl}>ID кабінету</label><input value={acc.accountId} onChange={e=>updateAccount(i,'accountId',e.target.value)} placeholder="act_123456" required style={inp} onFocus={e=>{e.target.style.borderColor='#e60000'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} /></div>
                    <div><label style={lbl}>Назва</label><input value={acc.name} onChange={e=>updateAccount(i,'name',e.target.value)} placeholder="Основний" required style={inp} onFocus={e=>{e.target.style.borderColor='#e60000'}} onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)'}} /></div>
                    <button type="button" onClick={()=>removeAccount(i)} disabled={adAccounts.length===1} style={{ padding:'10px', background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', cursor: adAccounts.length===1 ? 'not-allowed' : 'pointer', opacity: adAccounts.length===1 ? 0.3 : 1, transition:'color 0.15s' }}
                      onMouseEnter={e=>{ if(adAccounts.length>1)(e.currentTarget).style.color='#ff4444' }}
                      onMouseLeave={e=>{ (e.currentTarget).style.color='rgba(255,255,255,0.2)' }}
                    ><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', borderRadius:'8px', color:'#ff6b6b', fontSize:'13px', marginBottom:'14px' }}>
                <AlertCircle size={14} style={{flexShrink:0}}/>{error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background: loading?'#333':'#e60000', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', letterSpacing:'0.02em' }}
              onMouseEnter={e=>{ if(!loading){(e.currentTarget).style.background='#cc0000';(e.currentTarget).style.boxShadow='0 4px 24px rgba(230,0,0,0.35)';(e.currentTarget).style.transform='translateY(-1px)'} }}
              onMouseLeave={e=>{ (e.currentTarget).style.background='#e60000';(e.currentTarget).style.boxShadow='none';(e.currentTarget).style.transform='none' }}
            >
              {loading?<><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/>Створюємо...</>:'Створити клієнта →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
