import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listSites, createSite } from '@/lib/modules/expansion/site-selection/site.service'
import { writeAuditLog } from '@/lib/audit'

const attributesSchema = z.object({
  footfallScore: z.number().min(0).max(100).optional(),
  rentScore: z.number().min(0).max(100).optional(),
  competitiveDensityScore: z.number().min(0).max(100).optional(),
})

// mallId/crePartnerId are not .uuid()-constrained: seed data assigns
// human-readable ids to some reference entities (e.g. "seed-mall-mumbai-
// phoenix" in prisma/seed.ts), so a strict uuid format would reject
// legitimate references to them.
const createSchema = z.object({
  cityId: z.string().uuid(),
  mallId: z.string().min(1).optional(),
  crePartnerId: z.string().min(1).optional(),
  name: z.string().min(1),
  address: z.string().optional(),
  attributes: attributesSchema.default({}),
})

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:view')
  const sites = await listSites(ctx.organizationId)
  return NextResponse.json({ data: sites })
})

// POST /api/v1/expansion/sites — US-42.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:edit')

  const body = createSchema.parse(await req.json())
  const site = await createSite(ctx.organizationId, body)

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'site.created',
    entityType: 'site',
    entityId: site.id,
    after: { name: site.name, computedScore: site.computedScore },
  })

  return NextResponse.json({ data: site }, { status: 201 })
})
