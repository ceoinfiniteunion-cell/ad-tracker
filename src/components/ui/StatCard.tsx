'use client'
import { useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { AnimatedNumber } from './AnimatedNumber'

interface StatCardProps {
  label: string; value: string; icon: LucideIcon
  trend?: number; color?: 'red'|'white'|'green'|'blue'; delay?: number
}

const iconBg: Record<string,string> = {
  red:'rgba(230,0,0,0.12)', white:'var(--bg3)', green:'rgba(0,200,100,0.1)', blue:'rgba(59,130,246,0.1)'
}
const iconClr: Record<string,string> = {
  red:'#e60000', white:'var(--text2)', green:'#00c864', blue:'#3b82f6'
}
const valueClr: Record<string,string> = {
  red:'#e60000', white:'var(--text)', green:'#00c864', blue:'#3b82f6'
}

export function StatCard({ label, value, icon: Icon, trend, color='white', delay=0 }: StatCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="anim-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? color === 'red' ? 'rgba(230,0,0,0.06)' : 'var(--bg3)'
          : 'var(--bg2)',
        border: `1px solid ${hovered ? (color==='red'?'rgba(230,0,0,0.25)':color==='green'?'rgba(0,200,100,0.2)':'var(--border2)') : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '20px',
        animationDelay: `${delay}ms`,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? color==='red' ? '0 12px 32px rgba(230,0,0,0.15)' : '0 12px 32px rgba(0,0,0,0.15)'
          : 'none',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Фоновий градієнт при hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: color==='red'
            ? 'linear-gradient(135deg, rgba(230,0,0,0.04) 0%, transparent 60%)'
            : color==='green'
            ? 'linear-gradient(135deg, rgba(0,200,100,0.04) 0%, transparent 60%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)',
          borderRadius: '12px',
        }}/>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px', position:'relative' }}>
        <div style={{
          width:'36px', height:'36px', borderRadius:'8px', background:iconBg[color],
          display:'flex', alignItems:'center', justifyContent:'center',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: hovered ? 'scale(1.15) rotate(-5deg)' : 'scale(1)',
        }}>
          <Icon size={16} style={{ color:iconClr[color] }} />
        </div>
        {trend !== undefined && (
          <span style={{
            fontFamily:'monospace', fontSize:'11px', padding:'3px 8px', borderRadius:'4px',
            background: trend>=0 ? 'rgba(0,200,100,0.1)' : 'rgba(230,0,0,0.1)',
            color: trend>=0 ? '#00c864' : '#ff6b6b',
            transition: 'transform 0.3s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}>
            {trend>=0?'+':''}{trend.toFixed(1)}%
          </span>
        )}
      </div>

      <AnimatedNumber
        value={value}
        style={{
          display: 'block',
          fontSize: '22px',
          fontWeight: 800,
          color: valueClr[color],
          margin: 0,
          letterSpacing: '-0.02em',
          fontFamily: 'monospace',
          transition: 'color 0.3s ease',
        }}
      />
      <p style={{
        fontSize:'11px', color:'var(--text3)', marginTop:'6px',
        textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600,
        transition: 'color 0.3s ease',
        color: hovered ? 'var(--text2)' : 'var(--text3)',
      }}>{label}</p>
    </div>
  )
}
