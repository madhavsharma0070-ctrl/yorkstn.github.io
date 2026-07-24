import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { UnauthenticatedError, NotFoundError } from '@/lib/http/errors'
import type { MembershipRole } from '@/lib/validation/enums'

export interface OrgContext {
  userId: string
  organizationId: string
  role: MembershipRole
}

/** Throws UnauthenticatedError if there's no session. Use for any authenticated route. */
export async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new UnauthenticatedError()
  return session
}

/**
 * Resolves the caller's role for their *active* organization by querying the
 * DB fresh (never trusting a cached JWT role claim) — this is what
 * AUTH_RBAC.md §1 means by "claims are re-validated against the DB... for
 * role changes to take effect immediately." The active organizationId itself
 * comes from the server-side session (never a client-supplied parameter),
 * per API_SPECIFICATION.md §0.1.
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const session = await requireSession()
  const organizationId = session.user.activeOrganizationId
  if (!organizationId) {
    throw new NotFoundError('No active organization selected. Complete onboarding first.')
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
  })
  if (!membership || membership.status !== 'active') {
    throw new UnauthenticatedError('You no longer have access to this organization.')
  }

  return {
    userId: session.user.id,
    organizationId,
    role: membership.role as MembershipRole,
  }
}
