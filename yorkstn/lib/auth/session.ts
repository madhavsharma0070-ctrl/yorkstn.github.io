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
  if (session.user.userType !== 'org_user') {
    // Caught here (Milestone 6 smoke test) rather than falling through to
    // the generic "no active organization" message below, which is
    // confusing for a partner/staff session that will never have one.
    throw new UnauthenticatedError('This action requires a brand organization account.')
  }
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

/**
 * Yorkstn Staff session (AUTH_RBAC.md §3). Partner verification is a
 * platform-wide staff action, not org-scoped — `partners` is a shared
 * directory (DECISIONS.md D-14), so unlike `requireOrgContext` this does
 * not check a `staff_org_assignments` row. Org-scoped staff actions (e.g.
 * Managed Services engagements) check `isPlatformAdmin`/assignment
 * themselves — see `lib/modules/managed-services/engagement.service.ts`.
 * `isPlatformAdmin` is re-queried from the DB on every call (never trusted
 * from a cached JWT claim), matching `requireOrgContext`'s "claims are
 * re-validated against the DB" convention (AUTH_RBAC.md §1) — it gates
 * `/admin/**` actions, so a revoked admin flag must take effect immediately.
 */
export async function requireStaffSession() {
  const session = await requireSession()
  if (session.user.userType !== 'yorkstn_staff') {
    throw new UnauthenticatedError('Yorkstn Staff access required.')
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { isPlatformAdmin: true },
  })
  return { userId: session.user.id, isPlatformAdmin: user.isPlatformAdmin }
}

export interface PartnerContext {
  userId: string
  partnerId: string
}

/**
 * Partner-portal session (AUTH_RBAC.md §4). Resolves `session.userId ->
 * partners.id` via the unique `User.partnerId` FK — every partner-portal
 * route must call this first and scope all queries to the resolved
 * `partnerId`, never accept one from the client.
 */
export async function requirePartnerContext(): Promise<PartnerContext> {
  const session = await requireSession()
  if (session.user.userType !== 'partner') {
    throw new UnauthenticatedError('Partner access required.')
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { partnerId: true } })
  if (!user?.partnerId) {
    throw new NotFoundError('No partner profile linked to this account.')
  }

  return { userId: session.user.id, partnerId: user.partnerId }
}
