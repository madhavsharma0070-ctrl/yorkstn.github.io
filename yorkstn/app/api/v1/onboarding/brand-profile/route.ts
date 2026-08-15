import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { brandCategorySchema, priceTierSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const brandProfileSchema = z.object({
  category: brandCategorySchema,
  subCategory: z.string().optional(),
  priceTier: priceTierSchema,
  homeMarketPriceRange: z
    .object({ min: z.number(), max: z.number(), currency: z.string().length(3) })
    .optional(),
})

// POST /api/v1/onboarding/brand-profile — US-01, PRD §5's BrandProfile.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'org_profile:edit')

  const body = brandProfileSchema.parse(await req.json())

  const brandProfile = await prisma.brandProfile.upsert({
    where: { organizationId: ctx.organizationId },
    create: { organizationId: ctx.organizationId, ...body },
    update: body,
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'brand_profile.upserted',
    entityType: 'brand_profile',
    entityId: brandProfile.id,
    after: body,
  })

  return NextResponse.json({ data: brandProfile }, { status: 201 })
})
