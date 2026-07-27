import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { recalculateReadinessScore } from '@/lib/modules/market-intelligence/readiness-score/readiness-score.service'

const bodySchema = z.object({
  hasSecuredBudget: z.boolean().default(false),
  hasDefinedTimeline: z.boolean().default(false),
})

// POST /api/v1/market-intelligence/readiness-score/recalculate — AC US-16.
// Deterministic: same inputs always produce the same score (unit-tested at
// the scoring-function level in scoring-engine.test.ts).
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'readiness_score:recalculate')

  const capitalInputs = bodySchema.parse(await req.json().catch(() => ({})))
  const score = await recalculateReadinessScore(ctx.organizationId, capitalInputs)

  return NextResponse.json({ data: score }, { status: 201 })
})
