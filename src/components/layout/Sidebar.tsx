'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Users, LayoutDashboard, LogOut, Plus, BarChart2, Settings, FileText, Zap, Link2, Sun, Moon, ChevronsLeft, ChevronsRight, Menu, X, Shield } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const links = isAdmin ? [
    { href:'/admin', label:'Дашборд', icon:BarChart2 },
    { href:'/admin/stats', label:'Статистика', icon:BarChart2 },
    { href:'/admin/clients', label:'Клієнти', icon:Users },
    { href:'/admin/registrations', label:'Реєстрації', icon:Users },
    { href:'/admin/audit', label:'Audit Log', icon:Shield },
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

  // Мобільне нижнє меню
  const mobileLinks = isAdmin
    ? [
        { href:'/admin', label:'Дашборд', icon:BarChart2 },
        { href:'/admin/stats', label:'Статистика', icon:BarChart2 },
        { href:'/admin/clients', label:'Клієнти', icon:Users },
        { href:'/admin/reports', label:'Звіти', icon:FileText },
      ]
    : [
        { href:'/dashboard', label:'Дашборд', icon:LayoutDashboard },
        { href:'/stats', label:'Статистика', icon:BarChart2 },
        { href:'/reports', label:'Звіти', icon:FileText },
        { href:'/connect', label:'Кабінети', icon:Link2 },
      ]

  const isActive = (href: string) => pathname === href || (href !== '/admin' && href !== '/dashboard' && pathname.startsWith(href))

  // МОБІЛЬНА ВЕРСІЯ
  if (isMobile) {
    return (
      <>
        {/* Top bar */}
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'56px', background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', zIndex:1000 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="9" viewBox="0 0 44 22">
                <ellipse cx="11" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
                <ellipse cx="33" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
              </svg>
            </div>
            <span style={{ fontWeight:800, color:'var(--text)', fontSize:'15px' }}>Ad Tracker</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <button onClick={toggle} style={{ width:'32px', height:'32px', borderRadius:'8px', border:'1px solid var(--border)', background:'transparent', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ width:'32px', height:'32px', borderRadius:'8px', border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
          </div>
        </div>

        {/* Full menu overlay */}
        {mobileOpen && (
          <div style={{ position:'fixed', inset:0, zIndex:999, background:'var(--bg)', paddingTop:'56px', overflowY:'auto' }}>
            <div style={{ padding:'16px' }}>
              {/* User info */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'#e60000', flexShrink:0 }}>
                  {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p style={{ fontWeight:700, color:'var(--text)', fontSize:'14px', margin:0 }}>{session?.user?.name}</p>
                  <p style={{ fontSize:'11px', color:'var(--text3)', margin:0 }}>{session?.user?.email}</p>
                </div>
              </div>

              {/* Links */}
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {links.map(l => {
                  const Icon = l.icon
                  const active = isActive(l.href)
                  return (
                    <Link key={l.href} href={l.href} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', borderRadius:'10px', background: active ? 'rgba(230,0,0,0.1)' : 'transparent', border: active ? '1px solid rgba(230,0,0,0.2)' : '1px solid transparent', color: active ? '#e60000' : 'var(--text2)', textDecoration:'none', fontSize:'15px', fontWeight: active ? 700 : 500, transition:'all 0.15s' }}>
                      <Icon size={20} />
                      {l.label}
                    </Link>
                  )
                })}
              </div>

              {/* Logout */}
              <button onClick={async () => { await fetch('/api/auth/logout', {method:'POST'}); signOut({callbackUrl:'/auth/login'}) }}
                style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', padding:'13px 16px', borderRadius:'10px', background:'transparent', border:'1px solid transparent', color:'var(--text3)', fontSize:'15px', fontWeight:500, cursor:'pointer', marginTop:'8px', transition:'all 0.15s' }}>
                <LogOut size={20} />
                Вийти
              </button>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'60px', background:'var(--bg2)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', zIndex:998, paddingBottom:'env(safe-area-inset-bottom)' }}>
          {mobileLinks.map(l => {
            const Icon = l.icon
            const active = isActive(l.href)
            return (
              <Link key={l.href} href={l.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px', color: active ? '#e60000' : 'var(--text3)', textDecoration:'none', padding:'8px 4px', transition:'color 0.15s' }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
                <span style={{ fontSize:'10px', fontWeight: active ? 700 : 400 }}>{l.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px', color: mobileOpen ? '#e60000' : 'var(--text3)', background:'transparent', border:'none', cursor:'pointer', padding:'8px 4px' }}>
            <Menu size={20} strokeWidth={mobileOpen ? 2.5 : 1.8}/>
            <span style={{ fontSize:'10px', fontWeight: mobileOpen ? 700 : 400 }}>Меню</span>
          </button>
        </div>

        {/* Spacer top and bottom */}
        <div style={{ height:'56px', flexShrink:0 }}/>
      </>
    )
  }

  // ДЕСКТОП ВЕРСІЯ (без змін)
  const w = collapsed ? '64px' : '220px'
  return (
    <aside style={{ width:w, minWidth:w, background:'var(--bg2)', borderRight:'1px solid var(--border2)', boxShadow:'2px 0 12px rgba(0,0,0,0.15)', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0, transition:'width 0.25s ease, min-width 0.25s ease', overflow:'hidden' }}>
      <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'12px', overflow:'hidden' }}>
        <div style={{ width:'36px', height:'36px', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.25)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="22" height="11" viewBox="0 0 44 22">
            <ellipse cx="11" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
            <ellipse cx="33" cy="11" rx="9" ry="8" fill="none" stroke="#e60000" strokeWidth="2.5"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ overflow:'hidden' }}>
            <p style={{ fontWeight:800, color:'var(--text)', fontSize:'15px', lineHeight:1, margin:0, whiteSpace:'nowrap' }}>Ad Tracker</p>
            <p style={{ fontFamily:'monospace', fontSize:'10px', color:'var(--text3)', marginTop:'3px', whiteSpace:'nowrap' }}>by Infinite Union</p>
          </div>
        )}
      </div>
      <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto', overflowX:'hidden' }}>
        {links.map(l => {
          const Icon = l.icon
          const active = isActive(l.href)
          return (
            <Link key={l.href} href={l.href} title={collapsed ? l.label : undefined}
              style={{ display:'flex', alignItems:'center', gap:'10px', padding: collapsed ? '10px' : '10px 12px', borderRadius:'8px', marginBottom:'2px', background: active ? 'rgba(230,0,0,0.1)' : 'transparent', color: active ? '#e60000' : 'var(--text2)', textDecoration:'none', fontSize:'13px', fontWeight: active ? 700 : 500, transition:'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start', whiteSpace:'nowrap', overflow:'hidden' }}>
              <Icon size={18} style={{ flexShrink:0 }}/>
              {!collapsed && l.label}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding:'8px', borderTop:'1px solid var(--border)' }}>
        <button onClick={toggle} style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding: collapsed ? '10px' : '10px 12px', borderRadius:'8px', background:'transparent', border:'none', color:'var(--text3)', fontSize:'13px', cursor:'pointer', justifyContent: collapsed ? 'center' : 'flex-start', whiteSpace:'nowrap', overflow:'hidden' }}>
          {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
          {!collapsed && (theme === 'dark' ? 'Світла тема' : 'Темна тема')}
        </button>
        {!collapsed && session?.user && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', marginTop:'4px' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(230,0,0,0.12)', border:'1px solid rgba(230,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#e60000', flexShrink:0 }}>
              {session.user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <p style={{ fontWeight:700, color:'var(--text)', fontSize:'12px', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{session.user.name}</p>
              <p style={{ fontSize:'10px', color:'var(--text3)', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{session.user.email}</p>
            </div>
          </div>
        )}
        <button onClick={async () => { await fetch('/api/auth/logout', {method:'POST'}); signOut({callbackUrl:'/auth/login'}) }}
          style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding: collapsed ? '10px' : '10px 12px', borderRadius:'8px', background:'transparent', border:'none', color:'var(--text3)', fontSize:'13px', cursor:'pointer', justifyContent: collapsed ? 'center' : 'flex-start', whiteSpace:'nowrap', overflow:'hidden' }}>
          <LogOut size={18}/>
          {!collapsed && 'Вийти'}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding: collapsed ? '10px' : '10px 12px', borderRadius:'8px', background:'transparent', border:'none', color:'var(--text3)', fontSize:'13px', cursor:'pointer', justifyContent: collapsed ? 'center' : 'flex-start', whiteSpace:'nowrap', overflow:'hidden' }}>
          {collapsed ? <ChevronsRight size={18}/> : <><ChevronsLeft size={18}/><span>Згорнути</span></>}
        </button>
      </div>
    </aside>
  )
}
