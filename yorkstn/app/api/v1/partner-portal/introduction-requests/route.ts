import { NextResponse } from 'next/server'
import { requirePartnerContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listIntroductionRequestsForPartner } from '@/lib/modules/partners/introductions/introduction-request.service'

export const GET = withApiErrorHandling(async () => {
  const ctx = await requirePartnerContext()
  const requests = await listIntroductionRequestsForPartner(ctx.partnerId)
  return NextResponse.json({ data: requests })
})
