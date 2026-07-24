import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling, ConflictError, NotFoundError } from '@/lib/http/errors'
import { membershipRoleSchema, membershipStatusSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const updateSchema = z.object({
  role: membershipRoleSchema.optional(),
  status: membershipStatusSchema.optional(),
})

async function loadMembership(organizationId: string, membershipId: string) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } })
  if (!membership || membership.organizationId !== organizationId) {
    throw new NotFoundError('Member not found.')
  }
  return membership
}

// PATCH /api/v1/organizations/current/members/:membershipId — role/status change (owner/admin only).
export const PATCH = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { membershipId: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'members:manage')

    const target = await loadMembership(ctx.organizationId, params.membershipId)
    if (target.role === 'owner' && target.userId !== ctx.userId) {
      // [Design decision, Phase 4] Ownership transfer is out of MVP scope
      // (docs/phase2/DATABASE_SCHEMA.md §0.2 flags it as app-logic-enforced,
      // not built yet) — block editing another owner's membership rather
      // than silently allowing a demotion with no transfer flow.
      throw new ConflictError('Ownership transfer is not yet supported.')
    }

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.membership.update({ where: { id: target.id }, data: body })

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'membership.updated',
      entityType: 'membership',
      entityId: updated.id,
      before: { role: target.role, status: target.status },
      after: body,
    })

    return NextResponse.json({ data: updated })
  },
)

// DELETE /api/v1/organizations/current/members/:membershipId
export const DELETE = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { membershipId: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'members:manage')

    const target = await loadMembership(ctx.organizationId, params.membershipId)
    if (target.role === 'owner') {
      throw new ConflictError('The organization owner cannot be removed.')
    }

    await prisma.membership.delete({ where: { id: target.id } })

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'membership.removed',
      entityType: 'membership',
      entityId: target.id,
      before: { role: target.role },
    })

    return NextResponse.json({ data: { removed: true } })
  },
)
