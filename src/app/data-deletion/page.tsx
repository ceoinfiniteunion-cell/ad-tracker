import { LegalPage, h2Style, linkStyle, CONTACT_EMAIL } from '@/components/LegalPage'
import { DeletionStatus } from './DeletionStatus'

export const metadata = { title: 'Data Deletion — Infinite Union Ad Tracker' }

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Instructions" updated="November 7, 2026">
      <DeletionStatus />

      <p>Infinite Union Ad Tracker stores the advertising performance data of the ad accounts you connect, together with encrypted access tokens. You can delete this data in any of the following ways.</p>

      <h2 style={h2Style}>Option 1 — Remove a connected ad account (immediate)</h2>
      <ol>
        <li>Log in to the App and open <strong>Connections</strong> (Підключення).</li>
        <li>Click the trash icon next to the ad account and confirm.</li>
      </ol>
      <p>The account, its access token and all stored metrics are deleted immediately.</p>

      <h2 style={h2Style}>Option 2 — Remove the App from Facebook</h2>
      <ol>
        <li>Go to Facebook <strong>Settings &amp; privacy → Settings → Business Integrations</strong> (or <strong>Apps and Websites</strong>).</li>
        <li>Find <strong>Infinite Union Ad Tracker</strong>, click <strong>Remove</strong> and choose to delete the data shared with the App.</li>
      </ol>
      <p>Facebook sends us a deletion request and gives you a confirmation code and a link to this page, where you can check the status. All Meta data associated with your connection is deleted within 30 days.</p>

      <h2 style={h2Style}>Option 3 — Request deletion by email</h2>
      <p>Email <a href={`mailto:${CONTACT_EMAIL}?subject=Data%20deletion%20request`} style={linkStyle}>{CONTACT_EMAIL}</a> from the address of your App account with the subject &quot;Data deletion request&quot;. We will delete your account, connected ad accounts, tokens and metrics within 30 days and confirm by email.</p>

      <h2 style={h2Style}>What is deleted</h2>
      <ul>
        <li>Connected ad accounts and their encrypted access tokens</li>
        <li>Stored advertising metrics for those accounts</li>
        <li>For full account deletion: your profile, goals and comments</li>
      </ul>
    </LegalPage>
  )
}
