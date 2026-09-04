'use client'
import { useState } from 'react'
import { SpendChart } from '@/components/charts/SpendChart'
import { ClicksChart } from '@/components/charts/ClicksChart'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

const DEMO_DAILY = [
  { date:'2026-08-05', spend:142, impressions:28400, clicks:612, conversions:18, revenue:900 },
  { date:'2026-08-06', spend:198, impressions:39600, clicks:891, conversions:24, revenue:1200 },
  { date:'2026-08-07', spend:167, impressions:33400, clicks:734, conversions:21, revenue:1050 },
  { date:'2026-08-08', spend:223, impressions:44600, clicks:1002, conversions:31, revenue:1550 },
  { date:'2026-08-09', spend:189, impressions:37800, clicks:823, conversions:26, revenue:1300 },
  { date:'2026-08-10', spend:145, impressions:29000, clicks:623, conversions:17, revenue:850 },
  { date:'2026-08-11', spend:134, impressions:26800, clicks:589, conversions:15, revenue:750 },
  { date:'2026-08-12', spend:201, impressions:40200, clicks:904, conversions:28, revenue:1400 },
  { date:'2026-08-13', spend:234, impressions:46800, clicks:1056, conversions:33, revenue:1650 },
  { date:'2026-08-14', spend:178, impressions:35600, clicks:778, conversions:23, revenue:1150 },
  { date:'2026-08-15', spend:256, impressions:51200, clicks:1152, conversions:38, revenue:1900 },
  { date:'2026-08-16', spend:212, impressions:42400, clicks:956, conversions:30, revenue:1500 },
  { date:'2026-08-17', spend:189, impressions:37800, clicks:845, conversions:25, revenue:1250 },
  { date:'2026-08-18', spend:167, impressions:33400, clicks:734, conversions:20, revenue:1000 },
  { date:'2026-08-19', spend:198, impressions:39600, clicks:891, conversions:27, revenue:1350 },
  { date:'2026-08-20', spend:245, impressions:49000, clicks:1102, conversions:36, revenue:1800 },
  { date:'2026-08-21', spend:223, impressions:44600, clicks:1001, conversions:32, revenue:1600 },
  { date:'2026-08-22', spend:201, impressions:40200, clicks:902, conversions:28, revenue:1400 },
  { date:'2026-08-23', spend:178, impressions:35600, clicks:800, conversions:24, revenue:1200 },
  { date:'2026-08-24', spend:234, impressions:46800, clicks:1056, conversions:34, revenue:1700 },
  { date:'2026-08-25', spend:267, impressions:53400, clicks:1202, conversions:40, revenue:2000 },
  { date:'2026-08-26', spend:245, impressions:49000, clicks:1103, conversions:37, revenue:1850 },
  { date:'2026-08-27', spend:212, impressions:42400, clicks:955, conversions:31, revenue:1550 },
  { date:'2026-08-28', spend:189, impressions:37800, clicks:845, conversions:26, revenue:1300 },
  { date:'2026-08-29', spend:223, impressions:44600, clicks:1001, conversions:33, revenue:1650 },
  { date:'2026-08-30', spend:256, impressions:51200, clicks:1152, conversions:38, revenue:1900 },
  { date:'2026-09-01', spend:234, impressions:46800, clicks:1056, conversions:35, revenue:1750 },
  { date:'2026-09-02', spend:278, impressions:55600, clicks:1254, conversions:42, revenue:2100 },
  { date:'2026-09-03', spend:245, impressions:49000, clicks:1103, conversions:38, revenue:1900 },
  { date:'2026-09-04', spend:223, impressions:44600, clicks:1001, conversions:33, revenue:1650 },
]

const PLATFORMS = [
  { platform:'FACEBOOK', accountName:'Acme Store — Main', accountId:'act_123456789', color:'#1877f2',
    spend:3421, impressions:684200, clicks:15420, conversions:412, revenue:20600, ctr:2.25, cpc:0.22, roas:6.02, reach:312000, cpm:5.0 },
  { platform:'GOOGLE', accountName:'Acme Store — Google', accountId:'797-123-4567', color:'#e60000',
    spend:2890, impressions:521000, clicks:18234, conversions:356, revenue:17800, ctr:3.50, cpc:0.16, roas:6.16, reach:0, cpm:5.55 },
  { platform:'TIKTOK', accountName:'Acme Store — TikTok', accountId:'7657609852048097298', color:'#69C9D0',
    spend:1234, impressions:312000, clicks:8920, conversions:187, revenue:9350, ctr:2.86, cpc:0.14, roas:7.57, reach:187000, cpm:3.96 },
]

const totalSpend = PLATFORMS.reduce((s,p)=>s+p.spend,0)
const totalImpressions = PLATFORMS.reduce((s,p)=>s+p.impressions,0)
const totalClicks = PLATFORMS.reduce((s,p)=>s+p.clicks,0)
const totalConversions = PLATFORMS.reduce((s,p)=>s+p.conversions,0)
const totalRevenue = PLATFORMS.reduce((s,p)=>s+p.revenue,0)
const ctr = totalImpressions > 0 ? (totalClicks/totalImpressions)*100 : 0
const cpc = totalClicks > 0 ? totalSpend/totalClicks : 0
const roas = totalSpend > 0 ? totalRevenue/totalSpend : 0

const PCOLOR: Record<string,string> = { FACEBOOK:'#1877f2', GOOGLE:'#e60000', TIKTOK:'#69C9D0' }
const PLABEL: Record<string,string> = { FACEBOOK:'Meta / Facebook', GOOGLE:'Google Ads', TIKTOK:'TikTok Ads' }

export default function DemoPage() {
  const [activePlatform, setActivePlatform] = useState<string>('all')

  const displayPlatforms = activePlatform === 'all' ? PLATFORMS : PLATFORMS.filter(p=>p.platform===activePlatform)
  const dSpend = displayPlatforms.reduce((s,p)=>s+p.spend,0)
  const dRevenue = displayPlatforms.reduce((s,p)=>s+p.revenue,0)
  const dImpressions = displayPlatforms.reduce((s,p)=>s+p.impressions,0)
  const dClicks = displayPlatforms.reduce((s,p)=>s+p.clicks,0)
  const dConversions = displayPlatforms.reduce((s,p)=>s+p.conversions,0)
  const dCtr = dImpressions > 0 ? (dClicks/dImpressions)*100 : 0
  const dCpc = dClicks > 0 ? dSpend/dClicks : 0
  const dRoas = dSpend > 0 ? dRevenue/dSpend : 0

  const tabStyle = (active: boolean, color?: string) => ({
    padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600 as const, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
    background: active ? (color ? `${color}18` : 'rgba(230,0,0,0.12)') : 'transparent',
    color: active ? (color ?? '#ff4444') : 'rgba(255,255,255,0.4)',
    borderColor: active ? (color ? `${color}40` : 'rgba(230,0,0,0.3)') : 'rgba(255,255,255,0.1)',
  })

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#f0ede8', fontFamily:'system-ui,sans-serif' }}>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,15,0.95)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff' }}>IU</div>
          <span style={{ fontSize:15, fontWeight:700 }}>Infinite Union <span style={{ color:'#818cf8' }}>Ad Tracker</span></span>
          <span style={{ marginLeft:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:100 }}>LIVE DEMO</span>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Acme Marketing Agency · Demo Client</span>
          <a href="/auth/login" style={{ background:'#6366f1', color:'#fff', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none' }}>Request Access →</a>
        </div>
      </nav>

      {/* Demo banner */}
      <div style={{ background:'rgba(99,102,241,0.08)', borderBottom:'1px solid rgba(99,102,241,0.2)', padding:'10px 32px', display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:14 }}>🔍</span>
        <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.6)' }}>
          This is a <strong style={{ color:'#818cf8' }}>live demo</strong> of the Infinite Union Ad Tracker — an advertising analytics portal that connects Meta Ads, Google Ads, and TikTok Ads APIs to provide unified campaign reporting for agency clients.
          <a href="/auth/login" style={{ color:'#818cf8', marginLeft:8, fontWeight:600 }}>Request client access →</a>
        </p>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <p style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'rgba(255,255,255,0.3)', marginBottom:8 }}>// CLIENT DASHBOARD — DEMO</p>
          <h1 style={{ fontSize:26, fontWeight:800, margin:0 }}>Advertising Analytics</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:6 }}>Demo Client · Acme Marketing Agency · Last 30 days</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          {[
            { label:'Total Spend', value:formatCurrency(dSpend), sub:'Ad budget used', color:'#e60000' },
            { label:'Total Revenue', value:formatCurrency(dRevenue), sub:`ROAS: ${dRoas.toFixed(2)}×`, color:'#00c864' },
            { label:'Impressions', value:formatNumber(dImpressions), sub:`CTR: ${formatPercent(dCtr)}`, color:'rgba(255,255,255,0.8)' },
            { label:'Conversions', value:formatNumber(dConversions), sub:`CPC: ${formatCurrency(dCpc)}`, color:'#818cf8' },
          ].map(card=>(
            <div key={card.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'20px 24px' }}>
              <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>{card.label}</p>
              <p style={{ margin:'0 0 4px', fontSize:28, fontWeight:800, fontFamily:'monospace', color:card.color }}>{card.value}</p>
              <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.3)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Platform tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={()=>setActivePlatform('all')} style={tabStyle(activePlatform==='all')}>All Platforms</button>
          {PLATFORMS.map(p=>(
            <button key={p.platform} onClick={()=>setActivePlatform(p.platform)}
              style={{ ...tabStyle(activePlatform===p.platform, PCOLOR[p.platform]), display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:PCOLOR[p.platform] }}/>
              {PLABEL[p.platform]}
            </button>
          ))}
        </div>

        {/* Summary table */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Summary Metrics · 30 days</p>
            <p style={{ margin:0, fontFamily:'monospace', fontSize:11, color:'rgba(255,255,255,0.3)' }}>2026-08-05 → 2026-09-04</p>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                {['Metric','Value','Detail'].map(h=><th key={h} style={{ padding:'11px 20px', textAlign:'left', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { metric:'Ad Spend', value:formatCurrency(dSpend), detail:`Revenue: ${formatCurrency(dRevenue)}`, color:'#e60000' },
                { metric:'Impressions', value:formatNumber(dImpressions), detail:'Unique ad impressions', color:'rgba(255,255,255,0.8)' },
                { metric:'Clicks', value:formatNumber(dClicks), detail:`CTR: ${formatPercent(dCtr)}`, color:'rgba(255,255,255,0.8)' },
                { metric:'Conversions', value:formatNumber(dConversions), detail:`Cost per conversion: ${formatCurrency(dSpend/dConversions)}`, color:'#00c864' },
                { metric:'CPC', value:formatCurrency(dCpc), detail:'Average cost per click', color:'rgba(255,255,255,0.8)' },
                { metric:'ROAS', value:`${dRoas.toFixed(2)}×`, detail:`$1 spent → $${dRoas.toFixed(2)} revenue`, color:dRoas>=3?'#00c864':dRoas>=1?'#fbbf24':'#ff4444' },
              ].map(row=>(
                <tr key={row.metric} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                  <td style={{ padding:'14px 20px', fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>{row.metric}</td>
                  <td style={{ padding:'14px 20px', fontSize:15, fontWeight:800, color:row.color, fontFamily:'monospace' }}>{row.value}</td>
                  <td style={{ padding:'14px 20px', fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Platform breakdown */}
        {activePlatform === 'all' && (
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Platform Breakdown</p>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    {['Platform / Account','Spend','Revenue','Impressions','Clicks','CTR','CPC','ROAS'].map(h=>(
                      <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLATFORMS.map(p=>(
                    <tr key={p.platform} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }}
                      onClick={()=>setActivePlatform(p.platform)}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:PCOLOR[p.platform], flexShrink:0 }}/>
                          <div>
                            <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)', margin:0 }}>{p.accountName}</p>
                            <p style={{ fontFamily:'monospace', fontSize:10, color:'rgba(255,255,255,0.3)', margin:'2px 0 0' }}>{PLABEL[p.platform]}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'#e60000', fontWeight:700 }}>{formatCurrency(p.spend)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'#00c864', fontWeight:700 }}>{formatCurrency(p.revenue)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'rgba(255,255,255,0.6)' }}>{formatNumber(p.impressions)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'rgba(255,255,255,0.6)' }}>{formatNumber(p.clicks)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'rgba(255,255,255,0.6)' }}>{formatPercent(p.ctr)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, color:'rgba(255,255,255,0.6)' }}>{formatCurrency(p.cpc)}</td>
                      <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:13, fontWeight:700, color:p.roas>=3?'#00c864':p.roas>=1?'#fbbf24':'#ff4444' }}>{p.roas.toFixed(2)}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <SpendChart data={DEMO_DAILY} />
          <ClicksChart data={DEMO_DAILY} />
        </div>

        {/* Google Ads API usage explanation */}
        <div style={{ background:'rgba(66,133,244,0.06)', border:'1px solid rgba(66,133,244,0.2)', borderRadius:12, padding:'24px 28px', marginBottom:16 }}>
          <p style={{ fontFamily:'monospace', fontSize:10, letterSpacing:'0.1em', color:'rgba(66,133,244,0.7)', marginBottom:12 }}>// GOOGLE ADS API INTEGRATION</p>
          <h3 style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)', margin:'0 0 12px' }}>How we use the Google Ads API</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { title:'Read-only campaign data', desc:'We request campaign metrics (impressions, clicks, cost, conversions) via the Google Ads API reports endpoint. We never create, modify, or delete any campaigns.' },
              { title:'Client-authorized access', desc:'Each client connects their own Google Ads account via OAuth 2.0. The agency never has direct access to credentials — only the authorized token scoped to reporting.' },
              { title:'Automated sync every 2 hours', desc:'A scheduled job pulls the latest 30-day window of data per account. Historical data up to 90 days is available in the client dashboard.' },
              { title:'Unified reporting', desc:'Google Ads data is combined with Meta and TikTok metrics in a single dashboard, giving clients one place to monitor all their ad spend and performance.' },
            ].map(item=>(
              <div key={item.title} style={{ display:'flex', gap:12 }}>
                <span style={{ color:'#4285f4', fontSize:16, flexShrink:0, marginTop:2 }}>✓</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', margin:'0 0 4px' }}>{item.title}</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', margin:0, lineHeight:1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'24px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', margin:'0 0 12px' }}>Infinite Union Ad Tracker — Advertising analytics portal for agency clients</p>
          <a href="/auth/login" style={{ background:'#6366f1', color:'#fff', padding:'10px 24px', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none' }}>Request Access for Your Agency →</a>
        </div>

      </div>
    </div>
  )
}
