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
  TIKTOK:{bg:'rgba(255,255,255,0.07)',color:'var(--text2)',label:'TikTok'},
}

export default function AdminClientsPage() {
  const [clients,setClients]=useState<ClientData[]>([])
  const [loading,setLoading]=useState(true)
  const [isMobile,setIsMobile]=useState(false)

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768)
    check(); window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[])

  useEffect(()=>{ fetch('/api/clients').then(r=>r.json()).then(d=>{ setClients(d); setLoading(false) }) },[])

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', padding: isMobile ? '16px' : '36px 40px', position:'relative', zIndex:1 }}>

          <div className="anim-fade" style={{ display:'flex', alignItems: isMobile ? 'center' : 'flex-start', justifyContent:'space-between', marginBottom: isMobile ? '20px' : '32px', gap:'12px' }}>
            <div>
              <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// АДМІН ПАНЕЛЬ</p>
              <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight:800, color:'var(--text)', margin:0 }}>Клієнти</h1>
              {!isMobile && <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'6px' }}>Управління клієнтами та рекламними кабінетами</p>}
            </div>
            <Link href="/admin/new-client" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding: isMobile ? '9px 14px' : '11px 20px', background:'#e60000', color:'#fff', fontSize: isMobile ? '12px' : '13px', fontWeight:700, borderRadius:'8px', textDecoration:'none', flexShrink:0 }}>
              <Plus size={14}/>{isMobile ? 'Новий' : 'Новий клієнт'}
            </Link>
          </div>

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
              <div style={{ width:'32px', height:'32px', border:'2px solid rgba(230,0,0,0.2)', borderTopColor:'#e60000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : clients.length===0 ? (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'60px 40px', textAlign:'center' }}>
              <Users size={36} style={{ color:'rgba(255,255,255,0.1)', margin:'0 auto 16px' }} />
              <p style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', margin:'0 0 8px' }}>Клієнтів ще немає</p>
              <Link href="/admin/new-client" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 20px', background:'#e60000', color:'#fff', fontSize:'13px', fontWeight:700, borderRadius:'8px', textDecoration:'none' }}>
                <Plus size={15}/>Додати клієнта
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {clients.map((client,i)=>(
                <div key={client.id} className="anim-up" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding: isMobile ? '14px' : '20px 24px', animationDelay:`${i*50}ms` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                    {/* Ліва частина */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', flex:1, minWidth:0 }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(230,0,0,0.1)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:'15px', fontWeight:800, color:'#e60000' }}>{client.name[0].toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', margin:0 }}>{client.name}</p>
                        <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '3px' : '12px', marginTop:'4px' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'var(--text3)' }}>
                            <Building2 size={11}/><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.company}</span>
                          </span>
                          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'var(--text3)' }}>
                            <Mail size={11}/><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.user.email}</span>
                          </span>
                        </div>
                        <div style={{ display:'flex', gap:'6px', marginTop:'10px', flexWrap:'wrap' }}>
                          {client.adAccounts.map(acc=>{
                            const s=PS[acc.platform]??{bg:'rgba(255,255,255,0.07)',color:'var(--text2)',label:acc.platform}
                            return <span key={acc.id} style={{ fontFamily:'monospace', fontSize:'10px', padding:'3px 10px', borderRadius:'4px', background:s.bg, color:s.color, fontWeight:600 }}>{s.label} · {acc.accountId}</span>
                          })}
                          {client.adAccounts.length===0 && <span style={{ fontFamily:'monospace', fontSize:'11px', color:'var(--text4)' }}>Немає кабінетів</span>}
                        </div>
                      </div>
                    </div>
                    {/* Кнопка */}
                    <Link href={`/admin/clients/${client.id}`} style={{ display:'flex', alignItems:'center', gap:'4px', padding: isMobile ? '7px 10px' : '8px 14px', background:'transparent', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text3)', fontSize:'12px', textDecoration:'none', flexShrink:0 }}>
                      {isMobile ? <ArrowRight size={14}/> : <><span>Деталі</span><ArrowRight size={12}/></>}
                    </Link>
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
