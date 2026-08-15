import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Bare /app — route to wherever the user actually belongs.
export default async function AppIndexPage() {
  const session = await auth()
  if (!session?.user) redirect('/app/login')
  if (!session.user.activeOrganizationId) redirect('/app/onboarding')
  redirect('/app/dashboard')
}
