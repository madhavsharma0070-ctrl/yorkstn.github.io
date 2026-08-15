import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaffSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { postEngagementUpdate } from '@/lib/modules/managed-services/engagement.service'
import { engagementStatusSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const updateSchema = z.object({
  status: engagementStatusSchema.optional(),
  note: z.string().min(1),
  deliverableUrl: z.string().url().optional(),
})

// POST /api/v1/admin/managed-services/engagements/:id/updates — US-51.
// "yorkstn_staff (assigned)" per API_SPECIFICATION.md §7 — enforced inside
// postEngagementUpdate, not just by requireStaffSession, since it must also
// verify THIS staff member is the one assigned to THIS engagement.
export const POST = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const staff = await requireStaffSession()
    const body = updateSchema.parse(await req.json())
    const engagement = await postEngagementUpdate(params.id, staff.userId, staff.isPlatformAdmin, body)

    await writeAuditLog({
      organizationId: engagement.organizationId,
      actorUserId: staff.userId,
      action: 'managed_service_engagement.updated',
      entityType: 'managed_service_engagement',
      entityId: engagement.id,
      after: { status: engagement.status, note: body.note },
    })

    return NextResponse.json({ data: engagement })
  },
)
