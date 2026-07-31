import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import {
  generateCityRecommendations,
  DEFAULT_CITY_WEIGHTS,
} from '@/lib/modules/market-intelligence/city-recommendations.service'
import { writeAuditLog } from '@/lib/audit'

const weightsSchema = z
  .object({ populationTier: z.number().min(0).max(1), distributionMaturity: z.number().min(0).max(1) })
  .optional()

// US-15. Accepts optional user-adjustable criteria weights.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')

  const body = await req.json().catch(() => ({}))
  const weights = weightsSchema.parse(body.weights) ?? DEFAULT_CITY_WEIGHTS

  const insight = await generateCityRecommendations(ctx.organizationId, weights, ctx.userId)

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'ai_insight.generated',
    entityType: 'ai_insight',
    entityId: insight.id,
    after: { category: insight.category },
  })

  return NextResponse.json({ data: insight }, { status: 201 })
})
