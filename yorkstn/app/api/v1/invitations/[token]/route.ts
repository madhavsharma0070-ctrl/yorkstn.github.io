import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiErrorHandling, ConflictError, NotFoundError } from '@/lib/http/errors'

// GET /api/v1/invitations/:token — public, resolves the invite-accept preview screen.
export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: { token: string } }) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { organization: { select: { name: true } } },
  })
  if (!invitation) throw new NotFoundError('Invitation not found.')

  if (invitation.status === 'pending' && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } })
    invitation.status = 'expired'
  }

  if (invitation.status !== 'pending') {
    throw new ConflictError('This invitation is no longer valid.', { status: invitation.status })
  }

  return NextResponse.json({
    data: {
      organizationName: invitation.organization.name,
      role: invitation.role,
      email: invitation.email,
    },
  })
})
