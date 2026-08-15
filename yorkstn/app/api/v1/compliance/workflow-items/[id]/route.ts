import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { workflowItemStatusSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'
import { loadOwnedWorkflowItem } from '@/lib/modules/compliance/workflow-items.service'

const updateSchema = z.object({
  status: workflowItemStatusSchema.optional(),
  dueAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

// PATCH /api/v1/compliance/workflow-items/:id — API_SPECIFICATION.md §4.
export const PATCH = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'compliance:edit')

    const existing = await loadOwnedWorkflowItem(ctx.organizationId, params.id)
    const body = updateSchema.parse(await req.json())

    const updated = await prisma.complianceWorkflowItem.update({
      where: { id: existing.id },
      data: {
        status: body.status,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        payload: body.payload as Prisma.InputJsonValue | undefined,
      },
    })

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'compliance_workflow_item.updated',
      entityType: 'compliance_workflow_item',
      entityId: updated.id,
      before: { status: existing.status, dueAt: existing.dueAt },
      after: { status: updated.status, dueAt: updated.dueAt },
    })

    return NextResponse.json({ data: updated })
  },
)
