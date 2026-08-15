import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { generateConsumerInsights } from '@/lib/modules/market-intelligence/insights/consumer-insights.service'
import { writeAuditLog } from '@/lib/audit'

const bodySchema = z.object({ cityId: z.string().uuid().optional() })

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const { cityId } = bodySchema.parse(await req.json().catch(() => ({})))
  const insight = await generateConsumerInsights(ctx.organizationId, cityId, ctx.userId)

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
