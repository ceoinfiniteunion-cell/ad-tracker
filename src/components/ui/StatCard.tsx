import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string; value: string; icon: LucideIcon
  trend?: number; color?: 'red'|'white'|'green'|'blue'; delay?: number
}

const iconBg: Record<string,string> = { red:'rgba(230,0,0,0.12)', white:'rgba(255,255,255,0.06)', green:'rgba(0,200,100,0.1)', blue:'rgba(59,130,246,0.1)' }
const iconClr: Record<string,string> = { red:'#e60000', white:'rgba(255,255,255,0.6)', green:'#00c864', blue:'#3b82f6' }

export function StatCard({ label, value, icon: Icon, trend, color='white', delay=0 }: StatCardProps) {
  return (
    <div className="anim-up" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px', padding:'20px', animationDelay:`${delay}ms`, opacity:0, transition:'border-color 0.2s' }}
      onMouseEnter={e=>{ (e.currentTarget).style.borderColor='rgba(230,0,0,0.2)' }}
      onMouseLeave={e=>{ (e.currentTarget).style.borderColor='rgba(255,255,255,0.06)' }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:iconBg[color], display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={16} style={{ color:iconClr[color] }} />
        </div>
        {trend !== undefined && (
          <span style={{ fontFamily:'monospace', fontSize:'11px', padding:'3px 8px', borderRadius:'4px', background: trend>=0 ? 'rgba(0,200,100,0.1)' : 'rgba(230,0,0,0.1)', color: trend>=0 ? '#00c864' : '#ff6b6b' }}>
            {trend>=0?'+':''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p style={{ fontSize:'22px', fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.02em' }}>{value}</p>
      <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'6px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>{label}</p>
    </div>
  )
}
