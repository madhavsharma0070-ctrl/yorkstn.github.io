import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { requestEngagement, listEngagementsForOrg } from '@/lib/modules/managed-services/engagement.service'
import { writeAuditLog } from '@/lib/audit'

const createSchema = z.object({
  scope: z.string().min(1),
  linkedComplianceItemId: z.string().min(1).optional(),
})

// GET /api/v1/managed-services/engagements — API_SPECIFICATION.md §7, any org role (read-only).
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'managed_services:view')
  const engagements = await listEngagementsForOrg(ctx.organizationId)
  return NextResponse.json({ data: engagements })
})

// POST /api/v1/managed-services/engagements — US-50.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'managed_services:request')

  const body = createSchema.parse(await req.json())
  const engagement = await requestEngagement(ctx.organizationId, ctx.userId, body)

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'managed_service_engagement.requested',
    entityType: 'managed_service_engagement',
    entityId: engagement.id,
    after: { scope: engagement.scope, linkedComplianceItemId: engagement.linkedComplianceItemId },
  })

  return NextResponse.json({ data: engagement }, { status: 201 })
})
