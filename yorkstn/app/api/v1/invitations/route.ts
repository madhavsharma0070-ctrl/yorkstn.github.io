import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { membershipRoleSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const inviteSchema = z.object({
  email: z.string().email(),
  role: membershipRoleSchema,
})

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// POST /api/v1/invitations — US-02, API_SPECIFICATION.md §1.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'members:manage')

  const body = inviteSchema.parse(await req.json())
  const token = randomBytes(32).toString('hex')

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: ctx.organizationId,
      email: body.email.toLowerCase(),
      role: body.role,
      invitedByUserId: ctx.userId,
      token,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  })

  await writeAuditLog({
    organizationId: ctx.organizationId,
    actorUserId: ctx.userId,
    action: 'invitation.created',
    entityType: 'invitation',
    entityId: invitation.id,
    after: { email: invitation.email, role: invitation.role },
  })

  // Email delivery: this repo already has an AWS SES integration
  // (app/api/enquiry/route.ts). Wiring invitation emails through the same
  // SES client is a small follow-up, not done here — see TODO.md. The
  // invitation is fully functional via its direct /app/invite/:token link
  // in the meantime (returned in the response so the UI can show/copy it).
  return NextResponse.json(
    { data: { id: invitation.id, email: invitation.email, role: invitation.role, token: invitation.token } },
    { status: 201 },
  )
})

// GET /api/v1/invitations — list the active org's pending invitations (member-management UI).
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'members:manage')

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: invitations })
})
