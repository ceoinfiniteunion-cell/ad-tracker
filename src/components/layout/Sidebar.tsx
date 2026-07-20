'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { BarChart3, Users, LayoutDashboard, LogOut, Plus } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const links = isAdmin
    ? [{ href: '/admin/clients', label: 'Клієнти', icon: Users }, { href: '/admin/new-client', label: 'Новий клієнт', icon: Plus }]
    : [{ href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard }]

  return (
    <aside className="w-56 flex flex-col h-screen sticky top-0 shrink-0" style={{background:'#0d0d0d',borderRight:'1px solid rgba(255,255,255,0.05)'}}>
      {/* Logo */}
      <div className="p-5 mb-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:'rgba(230,0,0,0.15)',border:'1px solid rgba(230,0,0,0.3)'}}>
            <BarChart3 className="w-4 h-4" style={{color:'#e60000'}} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">Ad Tracker</p>
            <p className="mono text-xs mt-0.5" style={{color:'rgba(255,255,255,0.3)'}}>by Infinite Union</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all" style={active ? {background:'rgba(230,0,0,0.12)',color:'#ff4444',borderLeft:'2px solid #e60000',paddingLeft:'10px'} : {color:'rgba(255,255,255,0.45)',borderLeft:'2px solid transparent',paddingLeft:'10px'}}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center mb-2" style={{background:'rgba(230,0,0,0.15)'}}>
            <span className="text-xs font-bold" style={{color:'#e60000'}}>{session?.user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
          <p className="text-xs truncate mono" style={{color:'rgba(255,255,255,0.3)'}}>{session?.user?.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all" style={{color:'rgba(255,255,255,0.35)'}}>
          <LogOut className="w-4 h-4" />Вийти
        </button>
      </div>
    </aside>
  )
}
