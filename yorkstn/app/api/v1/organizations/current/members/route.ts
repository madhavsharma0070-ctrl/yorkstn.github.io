import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'

// GET /api/v1/organizations/current/members — API_SPECIFICATION.md §2. Any org role can view.
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()

  const memberships = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    data: memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: m.status,
    })),
  })
})
