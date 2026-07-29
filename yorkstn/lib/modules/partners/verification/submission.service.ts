import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Partner-portal's own-profile read/write (US-34). Returns ALL fields
 * including `rejectionReason` — this is the partner looking at their own
 * data, which is exactly why it must be a separate function from the
 * brand-facing read in directory/profile.service.ts (docs/phase3/
 * partner-discovery-engineering-spec.md §5).
 */
export async function getOwnPartnerProfile(partnerId: string) {
  return prisma.partner.findUniqueOrThrow({
    where: { id: partnerId },
    include: {
      cities: { include: { city: true } },
      references: true,
      verifications: { orderBy: { submittedAt: 'desc' } },
    },
  })
}

export interface UpdateProfileInput {
  businessName?: string
  description?: string
  capacityAttributes?: Record<string, unknown>
  contactChannel?: string
  cityIds?: string[]
}

export async function updateOwnPartnerProfile(partnerId: string, input: UpdateProfileInput) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.partner.update({
      where: { id: partnerId },
      data: {
        businessName: input.businessName,
        description: input.description,
        capacityAttributes: input.capacityAttributes as Prisma.InputJsonValue | undefined,
        contactChannel: input.contactChannel,
      },
    })

    if (input.cityIds) {
      await tx.partnerCity.deleteMany({ where: { partnerId } })
      await tx.partnerCity.createMany({
        data: input.cityIds.map((cityId) => ({ partnerId, cityId })),
      })
    }

    return updated
  })
}

/**
 * Submits (or resubmits) for verification — creates a new pending
 * `PartnerVerification` review record. Does NOT itself change
 * `partners.verification_status`; that only changes on Staff decision
 * (review-queue.service.ts), and a resubmission after rejection correctly
 * starts back at `pending`.
 */
export async function submitForVerification(partnerId: string) {
  return prisma.$transaction(async (tx) => {
    const verification = await tx.partnerVerification.create({
      data: { partnerId, status: 'pending' },
    })
    await tx.partner.update({ where: { id: partnerId }, data: { verificationStatus: 'pending' } })
    return verification
  })
}
