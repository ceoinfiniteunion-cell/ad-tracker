import { LegalPage, h2Style, linkStyle, CONTACT_EMAIL } from '@/components/LegalPage'

export const metadata = { title: 'Terms of Service — Infinite Union Ad Tracker' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 7, 2026">
      <h2 style={h2Style}>1. Service</h2>
      <p>Infinite Union Ad Tracker (&quot;the App&quot;) is an advertising analytics portal operated by Infinite Union agency for its clients. It shows performance data from advertising accounts the client connects (Meta, Google Ads, TikTok Ads).</p>

      <h2 style={h2Style}>2. Accounts</h2>
      <p>Access is granted to agency clients after registration is approved by Infinite Union. You are responsible for keeping your login credentials confidential and for all activity under your account. You may enable two-factor authentication in your profile.</p>

      <h2 style={h2Style}>3. Connected Advertising Accounts</h2>
      <p>You may only connect advertising accounts you own or are authorized to access. By connecting an account you authorize the App to read its advertising performance data through the platform&apos;s official API. The App does not make changes to your ads or ad accounts. You can disconnect an account at any time on the My ad accounts (Мої кабінети) page.</p>

      <h2 style={h2Style}>4. Acceptable Use</h2>
      <p>You agree not to misuse the App, attempt to access data of other clients, interfere with its operation, or use it in violation of the terms of Meta, Google or TikTok.</p>

      <h2 style={h2Style}>5. Data</h2>
      <p>How we handle data is described in the <a href="/privacy" style={linkStyle}>Privacy Policy</a>. Deletion options are described on the <a href="/data-deletion" style={linkStyle}>Data Deletion</a> page.</p>

      <h2 style={h2Style}>6. Availability and Accuracy</h2>
      <p>Metrics are synchronized from third-party platforms and may be delayed or differ from the platforms&apos; own interfaces. The App is provided &quot;as is&quot; without warranties of uninterrupted availability.</p>

      <h2 style={h2Style}>7. Termination</h2>
      <p>You may stop using the App and request deletion of your account at any time. We may suspend access that violates these terms.</p>

      <h2 style={h2Style}>8. Changes</h2>
      <p>We may update these terms; the date above shows the latest version.</p>

      <h2 style={h2Style}>9. Contact</h2>
      <p><a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a></p>
    </LegalPage>
  )
}
