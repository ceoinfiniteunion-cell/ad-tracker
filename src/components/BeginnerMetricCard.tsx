'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type StatusLevel = 'good' | 'warn' | 'neutral'

interface MetricMeta {
  emoji: string
  description: string
  fullExplanation: string
  statusFn: (val: number) => StatusLevel
}

const METRIC_META: Record<string, MetricMeta> = {
  totalSpend: {
    emoji: '💸',
    description: 'Скільки грошей витрачено на рекламу',
    fullExplanation: 'Загальна сума, яка була витрачена на всі рекламні кампанії у вибраному періоді. Включає Meta, Google та TikTok.',
    statusFn: () => 'neutral',
  },
  totalImpressions: {
    emoji: '👁️',
    description: 'Скільки разів люди бачили вашу рекламу',
    fullExplanation: 'Кожного разу, коли ваше оголошення з\'являлося на екрані — це один показ. Більше показів = більше охоплення аудиторії.',
    statusFn: (v) => v > 10000 ? 'good' : v > 500 ? 'neutral' : 'warn',
  },
  totalClicks: {
    emoji: '👆',
    description: 'Скільки разів клікнули на оголошення',
    fullExplanation: 'Кількість людей, які натиснули на ваше оголошення. Більше кліків означає, що реклама цікава аудиторії і спонукає до дії.',
    statusFn: (v) => v > 200 ? 'good' : v > 20 ? 'neutral' : 'warn',
  },
  totalConversions: {
    emoji: '🎯',
    description: 'Цільові дії: покупка, заявка, дзвінок',
    fullExplanation: 'Конверсія — це коли людина зробила потрібну дію: купила товар, залишила заявку, зателефонувала. Головний показник ефективності реклами.',
    statusFn: (v) => v > 10 ? 'good' : v > 0 ? 'neutral' : 'warn',
  },
  ctr: {
    emoji: '📊',
    description: 'Відсоток людей, які клікнули після перегляду. Норма: 1–3%',
    fullExplanation: 'CTR = Кліки ÷ Покази × 100%. Нижче 0.5% — варто покращити текст чи зображення оголошення. Вище 3% — відмінний результат!',
    statusFn: (v) => v >= 2 ? 'good' : v >= 0.5 ? 'neutral' : 'warn',
  },
  roas: {
    emoji: '📈',
    description: 'Скільки заробили на кожну витрачену гривню. Ціль: більше 3×',
    fullExplanation: 'ROAS = Дохід ÷ Витрати. ROAS 3× означає: витратили 1 000 грн — заробили 3 000 грн. Менше 1× — реклама збиткова і потребує оптимізації.',
    statusFn: (v) => v >= 3 ? 'good' : v >= 1 ? 'neutral' : 'warn',
  },
}

const STATUS_BADGE: Record<StatusLevel, { label: string; bg: string; color: string }> = {
  good:    { label: '✅ Добре',          bg: 'rgba(0,200,100,0.12)',   color: '#00c864' },
  warn:    { label: '⚠️ Зверни увагу',  bg: 'rgba(230,0,0,0.10)',     color: '#ff6b6b' },
  neutral: { label: '📌 Нейтрально',    bg: 'rgba(255,255,255,0.05)', color: 'var(--text4)' },
}

const BORDER_BY_STATUS: Record<StatusLevel, string> = {
  good:    'rgba(0,200,100,0.22)',
  warn:    'rgba(230,0,0,0.18)',
  neutral: 'var(--border)',
}

const VALUE_COLOR_BY_STATUS: Record<StatusLevel, string> = {
  good:    '#00c864',
  warn:    '#ff4444',
  neutral: 'var(--text)',
}

export interface BeginnerMetricCardProps {
  metricKey: string
  label: string
  value: string
  numericValue?: number
  delay?: number
}

export function BeginnerMetricCard({ metricKey, label, value, numericValue = 0, delay = 0 }: BeginnerMetricCardProps) {
  const [expanded, setExpanded] = useState(false)

  const meta = METRIC_META[metricKey]
  const status: StatusLevel = meta ? meta.statusFn(numericValue) : 'neutral'
  const badge = STATUS_BADGE[status]

  return (
    <div
      className="anim-up"
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${BORDER_BY_STATUS[status]}`,
        borderRadius: '16px',
        padding: '24px 24px 20px',
        animationDelay: `${delay}ms`,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Row: label + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>
            {meta?.emoji ?? '📌'}
          </span>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {label}
          </span>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 9px',
          borderRadius: '6px', background: badge.bg, color: badge.color,
          whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px',
        }}>
          {badge.label}
        </span>
      </div>

      {/* Value */}
      <p style={{
        fontSize: '36px',
        fontWeight: 800,
        color: VALUE_COLOR_BY_STATUS[status],
        margin: 0,
        letterSpacing: '-0.025em',
        fontFamily: 'monospace',
        lineHeight: 1.1,
      }}>
        {value}
      </p>

      {/* Short description */}
      {meta?.description && (
        <p style={{
          fontSize: '13px',
          color: 'var(--text3)',
          margin: '8px 0 0',
          lineHeight: 1.5,
        }}>
          {meta.description}
        </p>
      )}

      {/* Expandable explanation */}
      {meta?.fullExplanation && (
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text4)', fontSize: '12px', fontWeight: 600,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text4)' }}
          >
            Що це означає?
            <ChevronDown
              size={12}
              style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          {expanded && (
            <p style={{
              marginTop: '10px', marginBottom: 0,
              fontSize: '13px', color: 'var(--text3)',
              background: 'var(--bg3)', borderRadius: '8px',
              padding: '12px 14px', lineHeight: 1.65,
              animation: 'slideDown 0.15s ease',
            }}>
              {meta.fullExplanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
