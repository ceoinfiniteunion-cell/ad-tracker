'use client'

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f0ede8',
      fontFamily: '"Inter", system-ui, sans-serif',
      overflowX: 'hidden',
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>IU</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Infinite Union <span style={{ color: '#6366f1' }}>Ad Tracker</span></span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/privacy" style={{ color: '#888', fontSize: 14, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/auth/login" style={{ background: '#6366f1', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</a>
        </div>
      </nav>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '100px 48px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 100, marginBottom: 32, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Advertising Analytics Platform</div>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24, background: 'linear-gradient(135deg, #f0ede8 30%, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>All your ad metrics.<br />One secure dashboard.</h1>
        <p style={{ fontSize: 20, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 48px' }}>Infinite Union Ad Tracker connects your Meta, Google Ads, and TikTok accounts to give agency clients a unified view of campaign performance — updated automatically every 2 hours.</p>
        <a href="/auth/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '16px 40px', borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>Access Your Dashboard →</a>
      </section>
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '40px 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, textAlign: 'center' }}>
          {[{ value: '3', label: 'Ad Platforms Connected' },{ value: '2h', label: 'Auto-Sync Interval' },{ value: '90', label: 'Days of Historical Data' },{ value: '100%', label: 'Client Data Privacy' }].map(stat => (
            <div key={stat.label}><div style={{ fontSize: 40, fontWeight: 800, color: '#818cf8', letterSpacing: '-1px' }}>{stat.value}</div><div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{stat.label}</div></div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 48, textAlign: 'center' }}>Built for marketing agencies</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[{ icon: '📊', title: 'Unified Analytics Dashboard', desc: 'View campaign performance across Meta, Google Ads, and TikTok in a single interface. Impressions, clicks, spend, CPM, CTR, ROAS — all in one place.' },{ icon: '🔄', title: 'Automatic Data Sync', desc: 'Metrics sync automatically every 2 hours via secure API connections. Clients always see fresh data without any manual export or upload.' },{ icon: '📈', title: 'Campaign-Level Reporting', desc: 'Drill down into individual campaigns, ad sets, and accounts. Filter by platform, date range, or account to isolate exactly what you need.' },{ icon: '📄', title: 'CSV & PDF Export', desc: 'Generate detailed reports and export them as CSV or PDF. Reports can be sent directly to client email addresses from within the platform.' },{ icon: '🎯', title: 'Client Goal Tracking', desc: 'Set monthly spend, impression, or conversion targets for each client. Progress bars show how campaigns are tracking against agreed goals.' },{ icon: '🔒', title: 'Secure Client Portal', desc: 'Each client sees only their own data. Role-based access control separates agency admin views from client-facing dashboards.' }].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: 'rgba(99,102,241,0.05)', borderTop: '1px solid rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.15)', padding: '60px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.5px' }}>Connected advertising platforms</h2>
        <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 48 }}>Agency clients connect their ad accounts via secure OAuth. Data is read-only — we never modify campaigns.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[{ name: 'Meta Ads', color: '#1877f2', desc: 'Facebook & Instagram campaigns' },{ name: 'Google Ads', color: '#4285f4', desc: 'Search, Display & Performance Max' },{ name: 'TikTok Ads', color: '#ff0050', desc: 'TikTok for Business campaigns' }].map(p => (
            <div key={p.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 40px', minWidth: 220 }}>
              <div style={{ width: 12, height: 12, background: p.color, borderRadius: '50%', margin: '0 auto 16px', boxShadow: `0 0 16px ${p.color}` }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 56, textAlign: 'center' }}>How it works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[{ step: '01', title: 'Agency sets up client account', desc: 'The Infinite Union team creates a secure login for each client and connects their advertising accounts via OAuth or System User tokens.' },{ step: '02', title: 'Data syncs automatically', desc: 'The platform pulls campaign metrics from Meta, Google Ads, and TikTok APIs every 2 hours. 90 days of historical data is available immediately after setup.' },{ step: '03', title: 'Client reviews performance', desc: 'Clients log in to their personal dashboard to view spend, impressions, CTR, CPM, and conversions — broken down by platform, account, and campaign.' },{ step: '04', title: 'Reports generated on demand', desc: 'Agency or client can generate PDF/CSV reports for any date range and send them by email directly from the platform.' }].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: '28px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6366f1', letterSpacing: '1px', minWidth: 28, paddingTop: 3 }}>{s.step}</div>
              <div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{s.title}</div><div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>{s.desc}</div></div>
            </div>
          ))}
        </div>
      </section>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 48px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
        <div style={{ marginBottom: 16 }}><span style={{ fontWeight: 700, color: '#6b7280' }}>Infinite Union Ad Tracker</span> — Advertising analytics portal for Infinite Union agency clients</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <a href="/privacy" style={{ color: '#4b5563', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/auth/login" style={{ color: '#4b5563', textDecoration: 'none' }}>Client Login</a>
          <span>contact: ceoinfiniteunion@gmail.com</span>
        </div>
        <div style={{ marginTop: 16, color: '#374151' }}>© 2026 Infinite Union. All rights reserved.</div>
      </footer>
    </div>
  )
}
