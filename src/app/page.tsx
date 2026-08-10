import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from '@/components/LandingPage'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    const role = (session.user as any).role
    if (role === 'ADMIN') {
      redirect('/admin/clients')
    } else {
      redirect('/dashboard')
    }
  }

  return <LandingPage />
}
