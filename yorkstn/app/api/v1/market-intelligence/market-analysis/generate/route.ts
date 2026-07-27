import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { generateMarketAnalysis } from '@/lib/modules/market-intelligence/insights/market-analysis.service'

export const POST = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const insight = await generateMarketAnalysis(ctx.organizationId, ctx.userId)
  return NextResponse.json({ data: insight }, { status: 201 })
})
