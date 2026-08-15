import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'

// GET /api/v1/organizations/current — API_SPECIFICATION.md §2.
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    include: { brandProfile: true },
  })

  return NextResponse.json({ data: { ...organization, role: ctx.role } })
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  homeCountry: z.string().min(1).optional(),
})

export const PATCH = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'org_profile:edit')

  const body = updateSchema.parse(await req.json())
  const organization = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: body,
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'organization.updated',
    entityType: 'organization',
    entityId: organization.id,
    after: body,
  })

  return NextResponse.json({ data: organization })
})
