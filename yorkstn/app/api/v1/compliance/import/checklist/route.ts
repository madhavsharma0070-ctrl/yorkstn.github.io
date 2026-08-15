import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'
import { lookupHsnCompliance } from '@/lib/modules/compliance/import/hsn-lookup.service'
import { CHECKLIST_CONTENT_LAST_VERIFIED_AT } from '@/lib/modules/compliance/entity-formation/checklist-templates'

const bodySchema = z.object({
  productName: z.string().min(1),
  hsnCode: z.string().min(2),
})

const IEC_TASK_TITLE = 'Confirm/obtain Importer Exporter Code (IEC)'

// POST /api/v1/compliance/import/checklist — US-21, Category (b) curated
// checklist keyed off the product's HSN code (research/india-market-entry-
// regulatory-landscape.md §3, §5, §6).
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:edit')

  const body = bodySchema.parse(await req.json())
  const lookup = lookupHsnCompliance(body.hsnCode)

  const [complianceCase] = await Promise.all([
    prisma.complianceCase.findUniqueOrThrow({ where: { organizationId: ctx.organizationId } }),
    prisma.product.create({ data: { organizationId: ctx.organizationId, name: body.productName, hsnCode: body.hsnCode } }),
  ])

  const created = await prisma.$transaction(async (tx) => {
    const items = []

    // IEC is org-level, not per-product — only create it once.
    const existingIec = await tx.complianceWorkflowItem.findFirst({
      where: { complianceCaseId: complianceCase.id, workflowType: 'import_compliance', title: IEC_TASK_TITLE },
    })
    if (!existingIec) {
      items.push(
        await tx.complianceWorkflowItem.create({
          data: {
            complianceCaseId: complianceCase.id,
            workflowType: 'import_compliance',
            title: IEC_TASK_TITLE,
            status: 'pending',
            contentSourceUrl: lookup.sourceUrl,
            contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
          },
        }),
      )
    }

    items.push(
      await tx.complianceWorkflowItem.create({
        data: {
          complianceCaseId: complianceCase.id,
          workflowType: 'import_compliance',
          title: `DGFT/CBIC customs clearance for ${body.productName} (HSN ${lookup.chapter})`,
          status: 'pending',
          payload: { hsnCode: body.hsnCode, productName: body.productName },
          contentSourceUrl: lookup.sourceUrl,
          contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
        },
      }),
    )

    if (lookup.requiresLegalMetrologyLabel) {
      items.push(
        await tx.complianceWorkflowItem.create({
          data: {
            complianceCaseId: complianceCase.id,
            workflowType: 'import_compliance',
            title: `Legal Metrology label compliance for ${body.productName}`,
            status: 'pending',
            contentSourceUrl: lookup.sourceUrl,
            contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
          },
        }),
      )
    }

    if (lookup.requiresBis) {
      items.push(
        await tx.complianceWorkflowItem.create({
          data: {
            complianceCaseId: complianceCase.id,
            workflowType: 'import_compliance',
            title: `BIS certification required for ${body.productName} (${lookup.bisScheme}) — see BIS workflow`,
            status: 'pending',
            payload: { bisScheme: lookup.bisScheme },
            contentSourceUrl: lookup.sourceUrl,
            contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
          },
        }),
      )
    }

    return items
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'import_compliance.checklist_created',
    entityType: 'compliance_workflow_item',
    entityId: created[0].id,
    after: { productName: body.productName, hsnCode: body.hsnCode },
  })

  return NextResponse.json({ data: { lookup, items: created } }, { status: 201 })
})
