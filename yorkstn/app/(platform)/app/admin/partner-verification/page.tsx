import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminVerificationQueueClient } from './queue-client'

// US-35 — Yorkstn Staff only. Server-side gate before rendering the client list.
export default async function AdminPartnerVerificationPage() {
  const session = await auth()
  if (!session?.user) redirect('/app/login')
  if (session.user.userType !== 'yorkstn_staff') redirect('/app/dashboard')

  return <AdminVerificationQueueClient />
}
