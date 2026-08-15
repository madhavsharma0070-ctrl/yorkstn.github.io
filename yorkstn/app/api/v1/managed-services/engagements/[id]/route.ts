import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getEngagementForOrg } from '@/lib/modules/managed-services/engagement.service'

// GET /api/v1/managed-services/engagements/:id — org-scoped detail + update history.
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'managed_services:view')
    const engagement = await getEngagementForOrg(ctx.organizationId, params.id)
    return NextResponse.json({ data: engagement })
  },
)
