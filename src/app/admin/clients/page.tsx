'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Users, Plus, Building2, Mail, ArrowRight } from 'lucide-react'

interface ClientData {
  id:string; name:string; company:string
  user:{ email:string; name:string; createdAt:string }
  adAccounts:{ id:string; platform:string; accountId:string; name:string }[]
}
const PS: Record<string,{bg:string;color:string;label:string}> = {
  FACEBOOK:{bg:'rgba(24,119,242,0.12)',color:'#1877f2',label:'Meta'},
  GOOGLE:{bg:'rgba(230,0,0,0.12)',color:'#e60000',label:'Google'},
  TIKTOK:{bg:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',label:'TikTok'},
}

export default function AdminClientsPage() {
  const [clients,setClients]=useState<ClientData[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ fetch('/api/clients').then(r=>r.json()).then(d=>{ setClients(d); setLoading(false) }) },[])

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none', zIndex:0 }} />
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'32px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:'8px' }}>// АДМІН ПАНЕЛЬ</p>
              <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', margin:0 }}>Клієнти</h1>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', marginTop:'6px' }}>Управління клієнтами та рекламними кабінетами</p>
            </div>
            <Link href="/admin/new-client" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e=>{ (e.currentTarget).style.background='#cc0000'; (e.currentTarget).style.boxShadow='0 4px 20px rgba(230,0,0,0.35)'; (e.currentTarget).style.transform='translateY(-1px)' }}
              onMouseLeave={e=>{ (e.currentTarget).style.background='#e60000'; (e.currentTarget).style.boxShadow='none'; (e.currentTarget).style.transform='none' }}
            >
              <Plus size={15}/>Новий клієнт
            </Link>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : clients.length===0 ? (
            <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'60px 40px', textAlign:'center' }}>
              <Users size={36} style={{ color:'rgba(255,255,255,0.1)', margin:'0 auto 16px' }} />
              <p style={{ fontSize:'15px', fontWeight:600, color:'#fff', margin:'0 0 8px' }}>Клієнтів ще немає</p>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', margin:'0 0 24px' }}>Додайте першого клієнта щоб почати</p>
              <Link href="/admin/new-client" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', textDecoration:'none' }}>
                <Plus size={15}/>Додати клієнта
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {clients.map((client,i)=>(
                <div key={client.id} className="anim-up" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px 24px', animationDelay:`${i*50}ms`, opacity:0, transition:'border-color 0.15s' }}
                  onMouseEnter={e=>{ (e.currentTarget).style.borderColor='rgba(230,0,0,0.2)' }}
                  onMouseLeave={e=>{ (e.currentTarget).style.borderColor='rgba(255,255,255,0.06)' }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'15px', fontWeight:800, color:'#e60000' }}>{client.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:700, color:'#fff', margin:0 }}>{client.name}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginTop:'4px' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Building2 size={11}/>{client.company}</span>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'rgba(255,255,255,0.35)' }}><Mail size={11}/>{client.user.email}</span>
                        </div>
                        <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                          {client.adAccounts.map(acc=>{
                            const s=PS[acc.platform]??{bg:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.5)',label:acc.platform}
                            return <span key={acc.id} style={{ fontFamily:'monospace', fontSize:'10px', padding:'3px 10px', borderRadius:'4px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label} · {acc.accountId}</span>
                          })}
                          {client.adAccounts.length===0 && <span style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>Немає кабінетів</span>}
                        </div>
                      </div>
                    </div>
                    <button style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.35)', fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>{ (e.currentTarget).style.borderColor='rgba(230,0,0,0.25)'; (e.currentTarget).style.color='#ff4444' }}
                      onMouseLeave={e=>{ (e.currentTarget).style.borderColor='rgba(255,255,255,0.07)'; (e.currentTarget).style.color='rgba(255,255,255,0.35)' }}
                    >
                      Деталі <ArrowRight size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
