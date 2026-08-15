import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'

// GET /api/v1/organizations/me — org-switcher data (API_SPECIFICATION.md §2).
export const GET = withApiErrorHandling(async () => {
  const session = await requireSession()

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, status: 'active' },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    data: memberships.map((m) => ({
      organizationId: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    })),
  })
})
