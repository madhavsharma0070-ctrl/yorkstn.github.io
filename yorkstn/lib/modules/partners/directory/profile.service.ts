import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'

/**
 * Brand-facing partner profile read (US-31). Deliberately a SEPARATE
 * function from the partner-portal's own-profile read (verification/
 * submission.service.ts) — never one function with a conditional field
 * strip, per docs/phase3/partner-discovery-engineering-spec.md §5's "hard
 * visibility rule": `rejectionReason` and internal `PartnerVerification`
 * history must never reach a brand-side caller, and a conditional strip is
 * exactly the kind of thing that gets missed when a new field is added later.
 */
export async function getPartnerProfileForBrand(partnerId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId, deletedAt: null },
    include: {
      cities: { include: { city: true } },
      references: true,
    },
  })
  if (!partner) throw new NotFoundError('Partner not found.')

  // Explicit allow-list, not a strip — adding a new Partner column later
  // requires a deliberate decision here, not an accidental leak.
  return {
    id: partner.id,
    category: partner.category,
    businessName: partner.businessName,
    description: partner.description,
    capacityAttributes: partner.capacityAttributes,
    verificationStatus: partner.verificationStatus,
    contactChannel: partner.contactChannel,
    cities: partner.cities.map((pc) => ({ id: pc.city.id, name: pc.city.name, state: pc.city.state })),
    references: partner.references.map((r) => ({ referenceName: r.referenceName, note: r.note })),
  }
}
