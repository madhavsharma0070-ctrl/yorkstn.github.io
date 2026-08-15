import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireStaffSession } from '@/lib/auth/session'
import { withApiErrorHandling, ForbiddenApiError } from '@/lib/http/errors'
import { assignStaffToEngagement } from '@/lib/modules/managed-services/engagement.service'
import { writeAuditLog } from '@/lib/audit'

const assignSchema = z.object({ staffUserId: z.string().min(1) })

// POST /api/v1/admin/managed-services/engagements/:id/assign — platform-admin
// only. This is the exact moment AUTH_RBAC.md §3 says a staff_org_assignments
// row is created (scope 'full') for the assigned staff member.
export const POST = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const staff = await requireStaffSession()
    if (!staff.isPlatformAdmin) {
      throw new ForbiddenApiError('Only a platform admin may assign engagements.')
    }

    const { staffUserId } = assignSchema.parse(await req.json())
    const engagement = await assignStaffToEngagement(params.id, staffUserId)

    await writeAuditLog({
      organizationId: engagement.organizationId,
      actorUserId: staff.userId,
      action: 'managed_service_engagement.assigned',
      entityType: 'managed_service_engagement',
      entityId: engagement.id,
      after: { assignedStaffUserId: staffUserId },
    })

    return NextResponse.json({ data: engagement })
  },
)
