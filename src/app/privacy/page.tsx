import { LegalPage, h2Style, linkStyle, CONTACT_EMAIL } from '@/components/LegalPage'

export const metadata = { title: 'Privacy Policy — Infinite Union Ad Tracker' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 7, 2026">
      <h2 style={h2Style}>1. About This App</h2>
      <p>Infinite Union Ad Tracker (&quot;the App&quot;) is an advertising analytics platform developed by Infinite Union agency. The App allows clients to connect their advertising accounts (Meta/Facebook, Google Ads, TikTok) and view performance metrics in one dashboard.</p>

      <h2 style={h2Style}>2. Data We Access</h2>
      <p>When you connect your Meta advertising account through Facebook Login for Business, the App requests access to:</p>
      <ul>
        <li><strong>ads_read</strong> — to read the list of your ad accounts and their performance data (spend, impressions, clicks, reach, conversions, video and engagement metrics)</li>
        <li><strong>business_management</strong> — to find the ad accounts owned by or shared with the Business Manager you authorize</li>
      </ul>
      <p>The App only reads advertising data. It does not create, edit, pause or delete ads, campaigns or ad accounts. It does not access personal posts, messages, friends lists or personal profile data.</p>
      <p>For Google Ads and TikTok Ads the App reads the same kind of advertising performance data through their official APIs.</p>

      <h2 style={h2Style}>3. How We Use Your Data</h2>
      <p>The advertising data is used exclusively to:</p>
      <ul>
        <li>Display your ad performance metrics in your personal dashboard</li>
        <li>Generate reports for your advertising campaigns</li>
        <li>Show statistics and analytics to help optimize your advertising</li>
      </ul>
      <p>We do not sell, share, or transfer your data to third parties.</p>

      <h2 style={h2Style}>4. Data Storage</h2>
      <p>Your advertising metrics are stored in our database hosted on Railway.app. Access tokens are encrypted (AES-256-GCM) and are never shown in the interface or sent to the browser.</p>

      <h2 style={h2Style}>5. Data Retention and Deletion</h2>
      <p>We retain your advertising data for as long as your account is active. You can remove a connected ad account at any time on the Connections page — its token and all stored metrics are deleted immediately. Other deletion options are described on the <a href="/data-deletion" style={linkStyle}>Data Deletion</a> page. Deletion requests are completed within 30 days.</p>

      <h2 style={h2Style}>6. Your Rights</h2>
      <ul>
        <li>Access your data stored in our system</li>
        <li>Request deletion of your data</li>
        <li>Revoke the App&apos;s access to Meta at any time via Facebook Settings → Business Integrations (or Apps and Websites)</li>
      </ul>

      <h2 style={h2Style}>7. Contact</h2>
      <p>For any privacy-related questions, contact us at: <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a></p>
    </LegalPage>
  )
}
