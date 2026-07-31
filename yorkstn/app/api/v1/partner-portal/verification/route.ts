import { NextResponse } from 'next/server'
import { requirePartnerContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { submitForVerification } from '@/lib/modules/partners/verification/submission.service'
import { writeAuditLog } from '@/lib/audit'

// POST /api/v1/partner-portal/verification — US-34.
export const POST = withApiErrorHandling(async () => {
  const ctx = await requirePartnerContext()
  const verification = await submitForVerification(ctx.partnerId)

  await writeAuditLog({
    actorUserId: ctx.userId,
    action: 'partner_verification.submitted',
    entityType: 'partner_verification',
    entityId: verification.id,
    after: { partnerId: ctx.partnerId, status: verification.status },
  })

  return NextResponse.json({ data: verification }, { status: 201 })
})
