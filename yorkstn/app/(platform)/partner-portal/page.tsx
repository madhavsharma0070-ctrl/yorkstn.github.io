import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function PartnerPortalIndexPage() {
  const session = await auth()
  if (!session?.user || session.user.userType !== 'partner') redirect('/app/login')
  redirect('/partner-portal/profile')
}
