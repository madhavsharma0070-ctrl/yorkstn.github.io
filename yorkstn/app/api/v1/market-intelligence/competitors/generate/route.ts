import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { generateCompetitorIntelligence } from '@/lib/modules/market-intelligence/insights/competitor-intelligence.service'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'market_intelligence:generate')
  const insight = await generateCompetitorIntelligence(ctx.organizationId, ctx.userId)

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
