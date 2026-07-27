import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling, ConflictError } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'

const bodySchema = z.object({ state: z.string().min(1) })

const SOURCE =
  'https://github.com/madhavsharma0070-ctrl/yorkstn.github.io/blob/main/research/india-market-entry-regulatory-landscape.md'
const CONTENT_LAST_VERIFIED_AT = new Date('2026-07-23T00:00:00Z')

/**
 * POST /api/v1/compliance/gst/states — US-22. Manually adds a required
 * per-state GST registration tracker item.
 *
 * KNOWN GAP (documented, not silent — docs/phase3/compliance-operating-
 * system-engineering-spec.md §6 / docs/phase2/MILESTONES.md Milestone 3):
 * this should auto-flag a new required state whenever a new site/warehouse
 * is added in the Retail Expansion Intelligence module (Milestone 7), which
 * doesn't exist yet. Until then, states are added manually here.
 */
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:edit')

  const { state } = bodySchema.parse(await req.json())
  const title = `GST registration — ${state}`

  const complianceCase = await prisma.complianceCase.findUniqueOrThrow({
    where: { organizationId: ctx.organizationId },
  })

  const existing = await prisma.complianceWorkflowItem.findFirst({
    where: { complianceCaseId: complianceCase.id, workflowType: 'gst', title },
  })
  if (existing) {
    throw new ConflictError(`A GST registration tracker for ${state} already exists.`)
  }

  const item = await prisma.complianceWorkflowItem.create({
    data: {
      complianceCaseId: complianceCase.id,
      workflowType: 'gst',
      title,
      status: 'pending',
      payload: { state },
      contentSourceUrl: SOURCE,
      contentLastVerifiedAt: CONTENT_LAST_VERIFIED_AT,
    },
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'gst.state_registration_added',
    entityType: 'compliance_workflow_item',
    entityId: item.id,
    after: { state },
  })

  return NextResponse.json({ data: item }, { status: 201 })
})
