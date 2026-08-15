import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { isContentStale } from '@/lib/modules/compliance/content-staleness'

// GET /api/v1/compliance/overview — US-26, cross-workflow timeline.
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:view')

  const complianceCase = await prisma.complianceCase.findUnique({
    where: { organizationId: ctx.organizationId },
    include: {
      workflowItems: {
        orderBy: [{ dueAt: 'asc' }, { status: 'asc' }],
      },
    },
  })

  const items = (complianceCase?.workflowItems ?? []).map((item) => ({
    ...item,
    isStale: isContentStale(item.contentLastVerifiedAt),
  }))

  return NextResponse.json({ data: items })
})
