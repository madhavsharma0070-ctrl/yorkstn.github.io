import { NextResponse } from 'next/server'
import { requirePartnerContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { submitForVerification } from '@/lib/modules/partners/verification/submission.service'

// POST /api/v1/partner-portal/verification — US-34.
export const POST = withApiErrorHandling(async () => {
  const ctx = await requirePartnerContext()
  const verification = await submitForVerification(ctx.partnerId)
  return NextResponse.json({ data: verification }, { status: 201 })
})
