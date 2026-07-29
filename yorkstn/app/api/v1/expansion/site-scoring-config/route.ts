import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { updateScoringWeights } from '@/lib/modules/expansion/site-selection/site.service'

const weightsSchema = z.object({
  footfall: z.number().min(0).max(1),
  rent: z.number().min(0).max(1),
  competitive_density: z.number().min(0).max(1),
  distribution_maturity: z.number().min(0).max(1),
})

// PUT /api/v1/expansion/site-scoring-config — US-42. Recomputes every
// site's score deterministically from the new weights.
export const PUT = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:edit')

  const weights = weightsSchema.parse(await req.json())
  const sites = await updateScoringWeights(ctx.organizationId, weights)
  return NextResponse.json({ data: sites })
})
