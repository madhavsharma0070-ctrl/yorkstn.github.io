import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { workflowTypeSchema } from '@/lib/validation/enums'
import { isContentStale } from '@/lib/modules/compliance/content-staleness'

// GET /api/v1/compliance/:workflowType — API_SPECIFICATION.md §4.
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { workflowType: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'compliance:view')

    const workflowType = workflowTypeSchema.parse(params.workflowType)

    const complianceCase = await prisma.complianceCase.findUnique({
      where: { organizationId: ctx.organizationId },
      include: {
        workflowItems: {
          where: { workflowType },
          orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    const items = (complianceCase?.workflowItems ?? []).map((item) => ({
      ...item,
      isStale: isContentStale(item.contentLastVerifiedAt),
    }))

    return NextResponse.json({ data: { workflowType, items } })
  },
)
