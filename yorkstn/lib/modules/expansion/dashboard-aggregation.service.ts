import { prisma } from '@/lib/db'
import { getLatestReadinessScore } from '@/lib/modules/market-intelligence/readiness-score/readiness-score.service'
import { syncRoadmapMilestones } from './roadmap/milestone-auto-sync'
import { isContentStale } from '@/lib/modules/compliance/content-staleness'

/**
 * Feature spec 4.7 — US-46, AC US-46. The ONE service whose primary job is
 * composing reads across all four modules (docs/phase3/retail-expansion-
 * intelligence-engineering-spec.md §4) — still done exclusively through
 * each module's own exported functions, never a raw cross-module join.
 */
export async function getDashboardSummary(organizationId: string) {
  const [readinessScore, complianceCase, introductionCounts, roadmap] = await Promise.all([
    getLatestReadinessScore(organizationId),
    prisma.complianceCase.findUnique({
      where: { organizationId },
      include: {
        workflowItems: {
          where: { status: { not: 'completed' } },
          orderBy: [{ dueAt: 'asc' }],
          take: 5,
        },
      },
    }),
    prisma.introductionRequest.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    }),
    syncRoadmapMilestones(organizationId),
  ])

  const openComplianceItems = (complianceCase?.workflowItems ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    dueAt: item.dueAt,
    isStale: isContentStale(item.contentLastVerifiedAt),
  }))

  return {
    readinessScore: readinessScore
      ? { score: readinessScore.score, drivers: readinessScore.drivers }
      : null,
    openComplianceItems,
    introductionRequestCounts: Object.fromEntries(
      introductionCounts.map((c) => [c.status, c._count]),
    ),
    roadmapMilestones: roadmap?.milestones ?? [],
  }
}
