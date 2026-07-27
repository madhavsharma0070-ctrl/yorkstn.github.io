import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getLatestInsight } from '@/lib/modules/market-intelligence/insight-generation.service'

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:view')
  const insight = await getLatestInsight(ctx.organizationId, 'demand_forecast')
  return NextResponse.json({ data: insight })
})
