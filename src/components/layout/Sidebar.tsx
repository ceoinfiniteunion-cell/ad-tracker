'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Users, LayoutDashboard, LogOut, Plus, BarChart2, Settings, FileText, Zap, Link2, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const links = isAdmin ? [
    { href:'/admin', label:'Дашборд', icon:BarChart2 },
    { href:'/admin/stats', label:'Статистика', icon:BarChart2 },
    { href:'/admin/clients', label:'Клієнти', icon:Users },
    { href:'/admin/new-client', label:'Новий клієнт', icon:Plus },
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
    <aside style={{ width:'220px', minWidth:'220px', background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0, transition:'background 0.3s' }}>
      <div style={{ padding:'20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'36px', height:'36px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="22" height="11" viewBox="0 0 44 22">
              <ellipse cx="11" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
              <ellipse cx="33" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:800, color:'var(--text)', fontSize:'14px', lineHeight:1, margin:0 }}>Ad Tracker</p>
            <p style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', marginTop:'3px' }}>by Infinite Union</p>
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
            <Link key={href} href={href} className="btn-ripple" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', fontWeight:500, textDecoration:'none', transition:'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', background:active?'rgba(230,0,0,0.1)':'transparent', color:active?'#ff4444':'var(--text3)', borderLeft:active?'2px solid #e60000':'2px solid transparent', transform: active?'translateX(2px)':'none' }}>
              <Icon size={15}/>{label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
        <button onClick={toggle}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', transition:'all 0.15s', fontWeight:500, marginBottom:'4px' }}
          onMouseEnter={e=>{ e.currentTarget.style.color='var(--text)'; e.currentTarget.style.background='var(--bg3)' }}
          onMouseLeave={e=>{ e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.background='transparent' }}
        >
          {theme==='dark' ? <Sun size={14}/> : <Moon size={14}/>}
          {theme==='dark' ? 'Світла тема' : 'Темна тема'}
        </button>

        <div style={{ padding:'8px 12px', marginBottom:'4px', borderRadius:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(230,0,0,0.15)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:'6px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, color:'#e60000' }}>{session?.user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session?.user?.name}</p>
          <p style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session?.user?.email}</p>
        </div>

        <button onClick={()=>signOut({callbackUrl:'/auth/login'})}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', color:'var(--text3)', background:'transparent', border:'none', cursor:'pointer', transition:'all 0.15s', fontWeight:500 }}
          onMouseEnter={e=>{ e.currentTarget.style.color='#ff4444'; e.currentTarget.style.background='rgba(230,0,0,0.08)' }}
          onMouseLeave={e=>{ e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.background='transparent' }}
        >
          <LogOut size={14}/>Вийти
        </button>
      </div>
    </aside>
  )
}
