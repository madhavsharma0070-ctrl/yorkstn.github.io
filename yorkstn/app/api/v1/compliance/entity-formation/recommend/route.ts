import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'
import { recommendEntityType } from '@/lib/modules/compliance/entity-formation/rules-engine'
import {
  ENTITY_FORMATION_CHECKLISTS,
  CHECKLIST_CONTENT_LAST_VERIFIED_AT,
} from '@/lib/modules/compliance/entity-formation/checklist-templates'

const inputSchema = z.object({
  intendsCommercialActivity: z.boolean(),
  hasSecuredSpecificContract: z.boolean(),
  wantsSeparateIndianEntity: z.boolean(),
  wantsLocalPartner: z.boolean(),
  preferredEntityForm: z.enum(['company', 'llp']),
})

// POST /api/v1/compliance/entity-formation/recommend — US-20, AC US-20.
// Deterministic — never calls an AI provider (DECISIONS.md D-04). Creates a
// "recommendation" workflow item (already complete) plus the auto-generated
// task checklist for the recommended entity type.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'entity_formation:recommend')

  const input = inputSchema.parse(await req.json())
  const result = recommendEntityType(input)

  const complianceCase = await prisma.complianceCase.findUniqueOrThrow({
    where: { organizationId: ctx.organizationId },
  })

  const checklist = ENTITY_FORMATION_CHECKLISTS[result.recommendedEntityType]
  const now = Date.now()

  const created = await prisma.$transaction(async (tx) => {
    const recommendation = await tx.complianceWorkflowItem.create({
      data: {
        complianceCaseId: complianceCase.id,
        workflowType: 'entity_formation',
        title: `Entity type recommendation: ${result.recommendedEntityType.toUpperCase()}`,
        status: 'completed',
        payload: { input },
        recommendedEntityType: result.recommendedEntityType,
        entityRationale: result.rationale,
        ruleEngineVersion: result.ruleEngineVersion,
        contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
      },
    })

    const tasks = await Promise.all(
      checklist.map((item) =>
        tx.complianceWorkflowItem.create({
          data: {
            complianceCaseId: complianceCase.id,
            workflowType: 'entity_formation',
            title: item.title,
            status: 'pending',
            dueAt: item.suggestedDueInDays !== null ? new Date(now + item.suggestedDueInDays * 86_400_000) : null,
            contentSourceUrl: item.contentSourceUrl,
            contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
          },
        }),
      ),
    )

    return { recommendation, tasks }
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'entity_formation.recommended',
    entityType: 'compliance_workflow_item',
    entityId: created.recommendation.id,
    after: { recommendedEntityType: result.recommendedEntityType },
  })

  return NextResponse.json({ data: created }, { status: 201 })
})
