import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ManagedServicesQueueClient } from './queue-client'

// US-51 — Yorkstn Staff only. Server-side gate before rendering the client list.
export default async function AdminManagedServicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/app/login')
  if (session.user.userType !== 'yorkstn_staff') redirect('/app/dashboard')

  return <ManagedServicesQueueClient />
}
