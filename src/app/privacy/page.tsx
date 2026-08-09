export default function PrivacyPage() {
  return (
    <div style={{ position:'fixed', inset:0, background:'#fff', overflowY:'auto', zIndex:9999 }}>
    <div style={{ maxWidth:'800px', margin:'0 auto', padding:'60px 40px', fontFamily:'system-ui, sans-serif', color:'#333', lineHeight:1.7 }}>
      <h1 style={{ fontSize:'32px', fontWeight:800, marginBottom:'8px' }}>Privacy Policy</h1>
      <p style={{ color:'#666', marginBottom:'40px' }}>Last updated: August 9, 2026</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>1. About This App</h2>
      <p>Infinite Union Ad Tracker ("the App") is an advertising analytics platform developed by Infinite Union agency. The App allows clients to connect their advertising accounts (Meta/Facebook, Google Ads, TikTok) and view performance metrics in one dashboard.</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>2. Data We Access</h2>
      <p>When you connect your Meta/Facebook advertising account, the App requests access to:</p>
      <ul>
        <li><strong>ads_read</strong> — to read your ad campaign performance data (impressions, clicks, spend, conversions)</li>
        <li><strong>ads_management</strong> — to access your ad account information</li>
        <li><strong>business_management</strong> — to access your Business Manager account information</li>
      </ul>
      <p>We only access advertising performance data. We do not access personal posts, messages, friends lists, or any personal Facebook profile data.</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>3. How We Use Your Data</h2>
      <p>The advertising data we access is used exclusively to:</p>
      <ul>
        <li>Display your ad performance metrics in your personal dashboard</li>
        <li>Generate reports for your advertising campaigns</li>
        <li>Show statistics and analytics to help optimize your advertising</li>
      </ul>
      <p>We do not sell, share, or transfer your data to third parties.</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>4. Data Storage</h2>
      <p>Your advertising metrics are stored securely in our database hosted on Railway.app. Access tokens are encrypted and stored securely. You can disconnect your account at any time by contacting us.</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>5. Data Retention</h2>
      <p>We retain your advertising data for as long as your account is active. Upon request, we will delete all your data within 30 days.</p>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your data stored in our system</li>
        <li>Request deletion of your data</li>
        <li>Disconnect your Meta account at any time via Facebook Settings → Apps and Websites</li>
      </ul>

      <h2 style={{ fontSize:'20px', fontWeight:700, marginTop:'32px' }}>7. Contact</h2>
      <p>For any privacy-related questions, contact us at: <a href="mailto:ceo@infiniteunion.com.ua" style={{ color:'#e60000' }}>ceo@infiniteunion.com.ua</a></p>

      <p style={{ marginTop:'40px', color:'#999', fontSize:'14px' }}>© 2026 Infinite Union. All rights reserved.</p>
    </div>
    </div>
  )
}
