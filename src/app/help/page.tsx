'use client'
import { Sidebar } from '@/components/layout/Sidebar'
import { MessageCircle, Bug, HelpCircle, Lightbulb, Phone, Clock, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function HelpPage() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const cards = [
    {
      icon: Bug,
      color: '#e60000',
      title: 'Знайшли помилку?',
      desc: 'Якщо щось не працює — кнопка не натискається, дані не завантажуються або відображається помилка — напишіть нам. Вкажіть що саме сталося і на якій сторінці.',
    },
    {
      icon: HelpCircle,
      color: '#1877f2',
      title: 'Щось незрозуміло?',
      desc: 'Не розумієте що означає якась метрика, як читати графік або як налаштувати звіт? Ми пояснимо простою мовою без технічного жаргону.',
    },
    {
      icon: Lightbulb,
      color: '#fbbf24',
      title: 'Є пропозиція?',
      desc: 'Хочете нову функцію, інший вигляд звітів або додаткові метрики? Ваші ідеї допомагають нам робити трекер кращим.',
    },
  ]

  const faqs = [
    { q: 'Як часто оновлюються дані?', a: 'Дані з рекламних кабінетів синхронізуються автоматично кожні 2 години. Якщо дані не оновились — перевірте статус підключення в розділі "Мої кабінети".' },
    { q: 'Чому ROAS показує 0?', a: 'ROAS розраховується як дохід ÷ витрати. Якщо у вас не налаштовано відстеження конверсій або доходу в рекламному кабінеті — ROAS буде 0. Зверніться до менеджера для налаштування.' },
    { q: 'Можу я завантажити звіт?', a: 'Так! В розділі "Звіти" є кнопки "Експорт CSV" та "PDF звіт". CSV відкривається в Excel, PDF можна відправити клієнту або керівнику.' },
    { q: 'Чому деякі дні відсутні в щоденній розбивці?', a: 'Якщо в певний день не було активних рекламних кампаній або витрати були нульові — цей день може не відображатись. Це нормально.' },
    { q: 'Як змінити пароль?', a: 'Перейдіть в розділ "Профіль" → блок "Зміна пароля". Введіть поточний пароль і новий пароль (мінімум 8 символів).' },
  ]

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:'720px', margin:'0 auto', padding: isMobile ? '16px 16px 80px' : '36px 40px' }}>

          {/* Header */}
          <div className="anim-fade" style={{ marginBottom: isMobile ? '24px' : '36px' }}>
            <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'var(--text3)', marginBottom:'8px' }}>// ПІДТРИМКА</p>
            <h1 style={{ fontSize: isMobile ? '24px' : '30px', fontWeight:800, color:'var(--text)', margin:'0 0 12px' }}>Центр допомоги</h1>
            <p style={{ fontSize:'15px', color:'var(--text3)', lineHeight:1.6, margin:0 }}>
              Ми тут щоб допомогти. Якщо у вас виникли питання, знайшли помилку або хочете запропонувати покращення — напишіть нашому менеджеру в Telegram. Зазвичай відповідаємо протягом кількох годин у робочий час.
            </p>
          </div>

          {/* CTA кнопка */}
          <div className="anim-up-1" style={{ background:'linear-gradient(135deg, rgba(0,136,204,0.12), rgba(0,136,204,0.05))', border:'1px solid rgba(0,136,204,0.25)', borderRadius:'16px', padding: isMobile ? '20px' : '28px 32px', marginBottom:'24px', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', gap:'16px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(0,136,204,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MessageCircle size={20} style={{ color:'#0088cc' }}/>
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:'16px', color:'var(--text)', margin:0 }}>Написати менеджеру</p>
                  <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>@infiniteunion_manager</p>
                </div>
              </div>
              <p style={{ fontSize:'13px', color:'var(--text3)', margin:0, lineHeight:1.5 }}>
                Відповідаємо в Telegram — найшвидший спосіб отримати допомогу
              </p>
            </div>
            <a href="https://t.me/infiniteunion_manager" target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 24px', background:'#0088cc', color:'#fff', fontWeight:700, fontSize:'14px', borderRadius:'10px', textDecoration:'none', flexShrink:0, whiteSpace:'nowrap' as const }}>
              <MessageCircle size={16}/>
              Відкрити Telegram
            </a>
          </div>

          {/* Причини звернення */}
          <div className="anim-up-2" style={{ marginBottom:'24px' }}>
            <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>З чим ми допоможемо</p>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:'12px' }}>
              {cards.map(card => {
                const Icon = card.icon
                return (
                  <div key={card.title} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${card.color}18`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                      <Icon size={18} style={{ color:card.color }}/>
                    </div>
                    <p style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', margin:'0 0 8px' }}>{card.title}</p>
                    <p style={{ fontSize:'13px', color:'var(--text3)', margin:0, lineHeight:1.5 }}>{card.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Робочий час */}
          <div className="anim-up-3" style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'16px' }}>
            <Clock size={20} style={{ color:'var(--text3)', flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', margin:'0 0 4px' }}>Час роботи підтримки</p>
              <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Пн–Пт: 9:00 – 20:00 · Сб: 10:00 – 17:00 · Нд: вихідний</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="anim-up-4">
            <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>Часті запитання</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {faqs.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:'32px', padding:'20px', background:'rgba(0,200,100,0.06)', border:'1px solid rgba(0,200,100,0.15)', borderRadius:'12px', display:'flex', alignItems:'center', gap:'12px' }}>
            <CheckCircle size={18} style={{ color:'#00c864', flexShrink:0 }}/>
            <p style={{ fontSize:'13px', color:'var(--text3)', margin:0, lineHeight:1.5 }}>
              Ваші звернення допомагають нам покращувати трекер. Дякуємо що користуєтесь нашим сервісом!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function FaqItem({ q, a }: { q:string; a:string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
      <button onClick={()=>setOpen(!open)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' as const, gap:'12px' }}>
        <span style={{ fontSize:'14px', fontWeight:600, color:'var(--text)' }}>{q}</span>
        <span style={{ fontSize:'18px', color:'var(--text3)', flexShrink:0, transform: open?'rotate(45deg)':'none', transition:'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ padding:'0 18px 14px', borderTop:'1px solid var(--border)' }}>
          <p style={{ fontSize:'13px', color:'var(--text3)', margin:'12px 0 0', lineHeight:1.6 }}>{a}</p>
        </div>
      )}
    </div>
  )
}
