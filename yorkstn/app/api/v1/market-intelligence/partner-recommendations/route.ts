import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getLatestInsight } from '@/lib/modules/market-intelligence/insight-generation.service'
import { generatePartnerRecommendations } from '@/lib/modules/partners/recommendations/partner-matching.service'

// GET /api/v1/market-intelligence/partner-recommendations — API_SPECIFICATION.md §5.
// URL grouped under market-intelligence per the IA; the underlying service
// lives in the partners module (docs/phase3/ai-market-intelligence-
// engineering-spec.md §4 — a thin re-export, not duplicated logic).
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:view')
  const insight = await getLatestInsight(ctx.organizationId, 'partner_recommendation')
  return NextResponse.json({ data: insight })
})

export const POST = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const insight = await generatePartnerRecommendations(ctx.organizationId, ctx.userId)
  return NextResponse.json({ data: insight }, { status: 201 })
})
