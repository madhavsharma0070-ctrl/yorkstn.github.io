import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { generateConsumerInsights } from '@/lib/modules/market-intelligence/insights/consumer-insights.service'

const bodySchema = z.object({ cityId: z.string().uuid().optional() })

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const { cityId } = bodySchema.parse(await req.json().catch(() => ({})))
  const insight = await generateConsumerInsights(ctx.organizationId, cityId, ctx.userId)
  return NextResponse.json({ data: insight }, { status: 201 })
})
