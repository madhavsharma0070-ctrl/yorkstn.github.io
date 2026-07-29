import { prisma } from '@/lib/db'

// Feature spec 4.4 — US-43. One roadmap per org, created eagerly at
// onboarding (app/api/v1/onboarding/organization/route.ts) with all 5
// phases pre-seeded — see DECISIONS.md's onboarding design note.
export async function getRoadmap(organizationId: string) {
  return prisma.expansionRoadmap.findUnique({
    where: { organizationId },
    include: { milestones: { orderBy: { createdAt: 'asc' } } },
  })
}
