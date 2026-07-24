import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/auth/session'
import { withApiErrorHandling, ForbiddenApiError } from '@/lib/http/errors'

const bodySchema = z.object({ organizationId: z.string().uuid() })

/**
 * POST /api/v1/session/active-organization — API_SPECIFICATION.md §0.4.
 * Validates the caller actually belongs to the requested org, then returns
 * success. The client is responsible for then calling next-auth's
 * `update({ activeOrganizationId })`, which round-trips through the `jwt`
 * callback (trigger: 'update') in auth.ts to persist the new claim — this
 * route is the server-side authorization check that callback trusts.
 */
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const session = await requireSession()
  const { organizationId } = bodySchema.parse(await req.json())

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
  })
  if (!membership || membership.status !== 'active') {
    throw new ForbiddenApiError('You are not a member of this organization.')
  }

  return NextResponse.json({ data: { organizationId, role: membership.role } })
})
