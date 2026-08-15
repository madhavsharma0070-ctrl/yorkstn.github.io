import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getLatestReadinessScore } from '@/lib/modules/market-intelligence/readiness-score/readiness-score.service'

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'readiness_score:view')
  const score = await getLatestReadinessScore(ctx.organizationId)
  return NextResponse.json({ data: score })
})
