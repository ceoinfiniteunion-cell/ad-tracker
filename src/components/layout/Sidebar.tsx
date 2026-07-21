'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Users, LayoutDashboard, LogOut, Plus, BarChart2, Settings, FileText, Zap, Link2 } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const links = isAdmin ? [
    { href:'/admin/clients', label:'Клієнти', icon:Users },
    { href:'/admin/new-client', label:'Новий клієнт', icon:Plus },
    { href:'/admin/stats', label:'Статистика', icon:BarChart2 },
    { href:'/admin/reports', label:'Звіти', icon:FileText },
    { href:'/admin/meta', label:'Meta API', icon:Zap },
    { href:'/profile', label:'Профіль', icon:Settings },
  ] : [
    { href:'/dashboard', label:'Дашборд', icon:LayoutDashboard },
    { href:'/stats', label:'Статистика', icon:BarChart2 },
    { href:'/reports', label:'Звіти', icon:FileText },
    { href:'/connect', label:'Мої кабінети', icon:Link2 },
    { href:'/profile', label:'Профіль', icon:Settings },
  ]

  return (
    <aside style={{ width:'220px', minWidth:'220px', background:'#0d0d0d', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0 }}>
      <div style={{ padding:'20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="22" height="11" viewBox="0 0 44 22">
              <ellipse cx="11" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
              <ellipse cx="33" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:800, color:'#fff', fontSize:'14px', lineHeight:1, margin:0 }}>Ad Tracker</p>
            <p style={{ fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:'3px' }}>by Infinite Union</p>
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 16px 0', overflow:'hidden' }}>
        <svg width="100%" height="20" viewBox="0 0 188 20" preserveAspectRatio="none">
          <path d="M0,10 C20,2 40,18 60,10 C80,2 100,18 120,10 C140,2 160,18 188,10" fill="none" stroke="rgba(230,0,0,0.2)" strokeWidth="1.5" strokeDasharray="4 4"/>
        </svg>
      </div>

      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:'3px', overflowY:'auto' }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, textDecoration:'none', transition:'all 0.15s', background:active?'rgba(230,0,0,0.1)':'transparent', color:active?'#ff4444':'rgba(255,255,255,0.45)', borderLeft:active?'2px solid #e60000':'2px solid transparent' }}>
              <Icon size={15}/>{label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding:'8px 12px', marginBottom:'4px', borderRadius:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(230,0,0,0.15)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:'6px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, color:'#e60000' }}>{session?.user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <p style={{ fontSize:'13px', fontWeight:600, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session?.user?.name}</p>
          <p style={{ fontFamily:'monospace', fontSize:'10px', color:'rgba(255,255,255,0.28)', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session?.user?.email}</p>
        </div>
        <button onClick={()=>signOut({callbackUrl:'/auth/login'})}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', color:'rgba(255,255,255,0.3)', background:'transparent', border:'none', cursor:'pointer', transition:'all 0.15s', fontWeight:500 }}
          onMouseEnter={e=>{ e.currentTarget.style.color='#ff4444'; e.currentTarget.style.background='rgba(230,0,0,0.08)' }}
          onMouseLeave={e=>{ e.currentTarget.style.color='rgba(255,255,255,0.3)'; e.currentTarget.style.background='transparent' }}
        >
          <LogOut size={14}/>Вийти
        </button>
      </div>
    </aside>
  )
}
