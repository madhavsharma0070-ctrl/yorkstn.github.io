import { prisma } from '@/lib/db'
import { NotFoundError, ForbiddenApiError } from '@/lib/http/errors'

/**
 * Managed Services (cross-cutting, US-50/51) — docs/phase2/FEATURE_SPECIFICATIONS.md
 * M.1/M.2. A brand requests an engagement (optionally linked to a Compliance
 * workflow item); a platform admin assigns a Yorkstn Staff member, which is
 * also the point `staff_org_assignments` gains a row for that org
 * (docs/phase2/AUTH_RBAC.md §3 — staff have zero org visibility until
 * assigned). The assigned staff member then updates status, each update
 * appended to `ManagedServiceUpdate` (never overwriting a single `notes`
 * field) so the brand always sees the full history in-platform, never an
 * off-platform channel (AC US-50/51).
 */

export async function requestEngagement(
  organizationId: string,
  requestedByUserId: string,
  input: { scope: string; linkedComplianceItemId?: string },
) {
  return prisma.managedServiceEngagement.create({
    data: {
      organizationId,
      requestedByUserId,
      scope: input.scope,
      linkedComplianceItemId: input.linkedComplianceItemId,
    },
  })
}

export async function listEngagementsForOrg(organizationId: string) {
  return prisma.managedServiceEngagement.findMany({
    where: { organizationId },
    include: { updates: { orderBy: { createdAt: 'asc' } }, assignedStaffUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getEngagementForOrg(organizationId: string, engagementId: string) {
  const engagement = await prisma.managedServiceEngagement.findUnique({
    where: { id: engagementId },
    include: { updates: { orderBy: { createdAt: 'asc' } }, assignedStaffUser: { select: { id: true, name: true } } },
  })
  if (!engagement || engagement.organizationId !== organizationId) {
    throw new NotFoundError('Engagement not found.')
  }
  return engagement
}

/** Yorkstn Staff triage view — platform admins see every unassigned engagement plus their own; other staff see only what's assigned to them (AUTH_RBAC.md §3's assignment-scoped access). */
export async function listEngagementsForStaff(staffUserId: string, isPlatformAdmin: boolean) {
  return prisma.managedServiceEngagement.findMany({
    where: isPlatformAdmin ? {} : { assignedStaffUserId: staffUserId },
    include: {
      organization: { select: { id: true, name: true } },
      updates: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  })
}

/**
 * Platform-admin-only. Assigning a staff member is the exact moment
 * AUTH_RBAC.md §3 says a `staff_org_assignments` row is created — scope
 * `full`, since Managed Services isn't one of the two granular scopes
 * (`compliance` | `partner_verification`) staff assignments otherwise carry.
 */
export async function assignStaffToEngagement(engagementId: string, staffUserId: string) {
  const engagement = await prisma.managedServiceEngagement.findUnique({ where: { id: engagementId } })
  if (!engagement) throw new NotFoundError('Engagement not found.')

  return prisma.$transaction(async (tx) => {
    await tx.staffOrgAssignment.upsert({
      where: { userId_organizationId: { userId: staffUserId, organizationId: engagement.organizationId } },
      create: { userId: staffUserId, organizationId: engagement.organizationId, scope: 'full' },
      update: {},
    })

    return tx.managedServiceEngagement.update({
      where: { id: engagementId },
      data: { assignedStaffUserId: staffUserId, status: engagement.status === 'requested' ? 'scoping' : engagement.status },
    })
  })
}

/** Only the assigned staff member (or a platform admin) may post updates — API_SPECIFICATION.md §7's "yorkstn_staff (assigned)". */
export async function postEngagementUpdate(
  engagementId: string,
  staffUserId: string,
  isPlatformAdmin: boolean,
  input: { status?: string; note: string; deliverableUrl?: string },
) {
  const engagement = await prisma.managedServiceEngagement.findUnique({ where: { id: engagementId } })
  if (!engagement) throw new NotFoundError('Engagement not found.')
  if (!isPlatformAdmin && engagement.assignedStaffUserId !== staffUserId) {
    throw new ForbiddenApiError('Only the assigned staff member may update this engagement.')
  }

  const newStatus = input.status ?? engagement.status

  return prisma.$transaction(async (tx) => {
    await tx.managedServiceUpdate.create({
      data: {
        engagementId,
        authorUserId: staffUserId,
        note: input.note,
        statusAtTime: newStatus,
      },
    })

    return tx.managedServiceEngagement.update({
      where: { id: engagementId },
      data: {
        status: newStatus,
        deliverableUrl: input.deliverableUrl ?? engagement.deliverableUrl,
      },
      include: { updates: { orderBy: { createdAt: 'asc' } } },
    })
  })
}
