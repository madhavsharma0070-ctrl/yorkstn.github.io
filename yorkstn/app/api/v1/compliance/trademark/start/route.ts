import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'

const bodySchema = z.object({ markName: z.string().min(1) })

const SOURCE =
  'https://github.com/madhavsharma0070-ctrl/yorkstn.github.io/blob/main/research/india-market-entry-regulatory-landscape.md'
const CONTENT_LAST_VERIFIED_AT = new Date('2026-07-23T00:00:00Z')

// POST /api/v1/compliance/trademark/start — US-24. Advancing through stages
// (search -> filing -> examination -> publication -> opposition_window ->
// registered) happens via the generic PATCH /compliance/workflow-items/:id
// route updating `payload.stage`.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:edit')

  const { markName } = bodySchema.parse(await req.json())

  const complianceCase = await prisma.complianceCase.findUniqueOrThrow({
    where: { organizationId: ctx.organizationId },
  })

  const item = await prisma.complianceWorkflowItem.create({
    data: {
      complianceCaseId: complianceCase.id,
      workflowType: 'trademark_ip',
      title: `Trademark registration: ${markName}`,
      status: 'in_progress',
      payload: { markName, stage: 'search' },
      contentSourceUrl: SOURCE,
      contentLastVerifiedAt: CONTENT_LAST_VERIFIED_AT,
    },
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'trademark.started',
    entityType: 'compliance_workflow_item',
    entityId: item.id,
    after: { markName },
  })

  return NextResponse.json({ data: item }, { status: 201 })
})
