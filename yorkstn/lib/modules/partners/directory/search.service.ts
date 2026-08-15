import { prisma } from '@/lib/db'
import type { PartnerCategory, PartnerVerifStatus } from '@/lib/validation/enums'

export interface PartnerSearchFilters {
  category?: PartnerCategory
  cityId?: string
  verificationStatus?: PartnerVerifStatus
}

/**
 * Partner directory search (US-30). Postgres full-text search is the
 * production target (docs/phase2/SYSTEM_ARCHITECTURE.md §6); at MVP/SQLite
 * scale, indexed equality/relation filters are sufficient and this
 * function's signature doesn't change when that swap happens later.
 *
 * Defaults to `verified` only unless explicitly widened — brand-side users
 * see unverified/pending partners only when they deliberately ask for them
 * (US-31's "visibly labeled if unverified" requirement then applies in the UI).
 */
export async function searchPartners(filters: PartnerSearchFilters) {
  return prisma.partner.findMany({
    where: {
      deletedAt: null,
      category: filters.category,
      verificationStatus: filters.verificationStatus ?? 'verified',
      ...(filters.cityId ? { cities: { some: { cityId: filters.cityId } } } : {}),
    },
    include: { cities: { include: { city: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
