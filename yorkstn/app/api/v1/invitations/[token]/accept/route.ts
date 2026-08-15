import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/auth/session'
import { withApiErrorHandling, ConflictError, NotFoundError } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'

// POST /api/v1/invitations/:token/accept — US-02.
export const POST = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { token: string } }) => {
    const session = await requireSession()

    const invitation = await prisma.invitation.findUnique({ where: { token: params.token } })
    if (!invitation) throw new NotFoundError('Invitation not found.')
    if (invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      throw new ConflictError('This invitation is no longer valid.', { status: invitation.status })
    }
    if (invitation.email !== session.user.email.toLowerCase()) {
      throw new ConflictError('This invitation was sent to a different email address.')
    }

    const membership = await prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findUnique({
        where: {
          userId_organizationId: { userId: session.user.id, organizationId: invitation.organizationId },
        },
      })
      if (existing) throw new ConflictError('You are already a member of this organization.')

      const m = await tx.membership.create({
        data: {
          userId: session.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          invitedByUserId: invitation.invitedByUserId,
        },
      })
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      })
      return m
    })

    await writeAuditLog({
      organizationId: invitation.organizationId,
      actorUserId: session.user.id,
      action: 'invitation.accepted',
      entityType: 'membership',
      entityId: membership.id,
      after: { role: membership.role },
    })

    return NextResponse.json({ data: { organizationId: invitation.organizationId, role: membership.role } })
  },
)
