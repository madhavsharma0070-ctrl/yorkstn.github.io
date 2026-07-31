import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { updateSite } from '@/lib/modules/expansion/site-selection/site.service'
import { siteStatusSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const updateSchema = z.object({
  status: siteStatusSchema.optional(),
  attributes: z
    .object({
      footfallScore: z.number().min(0).max(100).optional(),
      rentScore: z.number().min(0).max(100).optional(),
      competitiveDensityScore: z.number().min(0).max(100).optional(),
    })
    .optional(),
})

export const PATCH = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'expansion:edit')

    const body = updateSchema.parse(await req.json())
    const site = await updateSite(ctx.organizationId, params.id, body)

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'site.updated',
      entityType: 'site',
      entityId: site.id,
      after: { status: site.status, attributes: site.attributes },
    })

    return NextResponse.json({ data: site })
  },
)
