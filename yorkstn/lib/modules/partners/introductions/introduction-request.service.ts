import { prisma } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/http/errors'

// US-33 — brand -> partner outreach, visible-to-both-sides status.
export async function createIntroductionRequest(
  organizationId: string,
  partnerId: string,
  requestedByUserId: string,
  context?: string,
) {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId, deletedAt: null } })
  if (!partner) throw new NotFoundError('Partner not found.')

  return prisma.introductionRequest.create({
    data: { organizationId, partnerId, requestedByUserId, context },
  })
}

export async function listIntroductionRequestsForOrg(organizationId: string) {
  return prisma.introductionRequest.findMany({
    where: { organizationId },
    include: { partner: { select: { businessName: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listIntroductionRequestsForPartner(partnerId: string) {
  return prisma.introductionRequest.findMany({
    where: { partnerId },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

const VALID_PARTNER_TRANSITIONS: Record<string, string[]> = {
  sent: ['partner_viewed', 'accepted', 'declined'],
  partner_viewed: ['accepted', 'declined'],
}

/** Pure — the fixed introduction-request state machine, extracted for unit testing. */
export function isValidIntroductionTransition(currentStatus: string, newStatus: string): boolean {
  return (VALID_PARTNER_TRANSITIONS[currentStatus] ?? []).includes(newStatus)
}

/** Partner-side status transition (viewed/accepted/declined). Enforces the fixed state machine. */
export async function updateIntroductionRequestStatus(
  partnerId: string,
  requestId: string,
  newStatus: 'partner_viewed' | 'accepted' | 'declined',
) {
  const request = await prisma.introductionRequest.findUnique({ where: { id: requestId } })
  if (!request || request.partnerId !== partnerId) {
    throw new NotFoundError('Introduction request not found.')
  }

  if (!isValidIntroductionTransition(request.status, newStatus)) {
    throw new ConflictError(`Cannot transition from ${request.status} to ${newStatus}.`)
  }

  return prisma.introductionRequest.update({
    where: { id: requestId },
    data: { status: newStatus, respondedAt: new Date() },
  })
}
