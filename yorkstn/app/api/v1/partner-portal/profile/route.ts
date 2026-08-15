import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePartnerContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getOwnPartnerProfile, updateOwnPartnerProfile } from '@/lib/modules/partners/verification/submission.service'
import { writeAuditLog } from '@/lib/audit'

// GET /api/v1/partner-portal/profile — US-34. Own profile only, resolved
// via requirePartnerContext (AUTH_RBAC.md §4) — never a client-supplied ID.
export const GET = withApiErrorHandling(async () => {
  const ctx = await requirePartnerContext()
  const profile = await getOwnPartnerProfile(ctx.partnerId)
  return NextResponse.json({ data: profile })
})

const updateSchema = z.object({
  businessName: z.string().min(1).optional(),
  description: z.string().optional(),
  capacityAttributes: z.record(z.string(), z.unknown()).optional(),
  contactChannel: z.string().optional(),
  cityIds: z.array(z.string().uuid()).optional(),
})

export const PATCH = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requirePartnerContext()
  const body = updateSchema.parse(await req.json())
  const updated = await updateOwnPartnerProfile(ctx.partnerId, body)

  await writeAuditLog({
    actorUserId: ctx.userId,
    action: 'partner_profile.updated',
    entityType: 'partner',
    entityId: ctx.partnerId,
    after: body,
  })

  return NextResponse.json({ data: updated })
})
