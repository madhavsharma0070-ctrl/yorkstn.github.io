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

// POST /api/v1/compliance/bis/checklist — US-23. Shares the HSN lookup with
// the Import workflow (Category (b), research/india-market-entry-
// regulatory-landscape.md §5); only creates tasks when BIS actually applies.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:edit')

  const body = bodySchema.parse(await req.json())
  const lookup = lookupHsnCompliance(body.hsnCode)

  if (!lookup.requiresBis) {
    return NextResponse.json({ data: { lookup, items: [] } })
  }

  const complianceCase = await prisma.complianceCase.findUniqueOrThrow({
    where: { organizationId: ctx.organizationId },
  })

  const taskTitles =
    lookup.bisScheme === 'FMCS'
      ? [
          `Appoint an Authorized Indian Representative (AIR) for ${body.productName}`,
          `Obtain a Performance Bank Guarantee (PBG) for FMCS certification — ${body.productName}`,
          `Submit FMCS application and product testing for ${body.productName}`,
        ]
      : [
          `Confirm current CRS/QCO registration requirement for ${body.productName}`,
          `Submit BIS Compulsory Registration Scheme (CRS) application for ${body.productName}`,
        ]

  const items = await prisma.$transaction((tx) =>
    Promise.all(
      taskTitles.map((title) =>
        tx.complianceWorkflowItem.create({
          data: {
            complianceCaseId: complianceCase.id,
            workflowType: 'bis',
            title,
            status: 'pending',
            payload: { hsnCode: body.hsnCode, bisScheme: lookup.bisScheme },
            contentSourceUrl: lookup.sourceUrl,
            contentLastVerifiedAt: CHECKLIST_CONTENT_LAST_VERIFIED_AT,
          },
        }),
      ),
    ),
  )

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'bis.checklist_created',
    entityType: 'compliance_workflow_item',
    entityId: items[0].id,
    after: { productName: body.productName, bisScheme: lookup.bisScheme },
  })

  return NextResponse.json({ data: { lookup, items } }, { status: 201 })
})
