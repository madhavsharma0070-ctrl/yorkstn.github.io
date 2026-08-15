import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaffSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { decideVerification } from '@/lib/modules/partners/verification/review-queue.service'
import { writeAuditLog } from '@/lib/audit'

const bodySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
})

// POST /api/v1/admin/partner-verification-queue/:id/decision — US-35.
export const POST = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const staff = await requireStaffSession()
    const { decision, reason } = bodySchema.parse(await req.json())

    const updated = await decideVerification(params.id, staff.userId, decision, reason)

    // Platform-level action (no single organization owns a Partner) —
    // organizationId is intentionally null here (AuditLog's documented
    // nullable case for platform/admin actions, DATABASE_SCHEMA.md §7).
    await writeAuditLog({
      organizationId: null,
      actorUserId: staff.userId,
      action: 'partner_verification.decided',
      entityType: 'partner_verification',
      entityId: updated.id,
      after: { decision },
    })

    return NextResponse.json({ data: updated })
  },
)
