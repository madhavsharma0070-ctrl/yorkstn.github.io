import { NextResponse } from 'next/server'
import { requireStaffSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listPendingVerifications } from '@/lib/modules/partners/verification/review-queue.service'

// GET /api/v1/admin/partner-verification-queue — US-35, Yorkstn Staff only.
export const GET = withApiErrorHandling(async () => {
  await requireStaffSession()
  const queue = await listPendingVerifications()
  return NextResponse.json({ data: queue })
})
