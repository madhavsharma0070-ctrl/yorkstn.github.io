import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { generateDemandForecast } from '@/lib/modules/market-intelligence/insights/demand-forecast.service'

export const POST = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const insight = await generateDemandForecast(ctx.organizationId, ctx.userId)
  return NextResponse.json({ data: insight }, { status: 201 })
})
