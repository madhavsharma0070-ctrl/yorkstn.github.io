import { prisma } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/http/errors'

// US-35 — Yorkstn Staff verification queue.
export async function listPendingVerifications() {
  return prisma.partnerVerification.findMany({
    where: { status: 'pending' },
    include: { partner: true },
    orderBy: { submittedAt: 'asc' },
  })
}

export async function decideVerification(
  verificationId: string,
  reviewedByUserId: string,
  decision: 'approved' | 'rejected',
  reason?: string,
) {
  const verification = await prisma.partnerVerification.findUnique({ where: { id: verificationId } })
  if (!verification) throw new NotFoundError('Verification submission not found.')
  if (verification.status !== 'pending') {
    throw new ConflictError('This verification submission has already been decided.')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.partnerVerification.update({
      where: { id: verificationId },
      data: {
        status: decision,
        reviewedByUserId,
        reviewedAt: new Date(),
        rejectionReason: decision === 'rejected' ? reason : null,
      },
    })

    // Approved -> partners.verification_status flips to 'verified'.
    // Rejected -> reverts to 'unverified' (never stays 'pending' after a
    // decision) with the reason visible ONLY to the partner, never to brands
    // (enforced by directory/profile.service.ts's allow-list, not here).
    await tx.partner.update({
      where: { id: verification.partnerId },
      data: { verificationStatus: decision === 'approved' ? 'verified' : 'unverified' },
    })

    return updated
  })
}
