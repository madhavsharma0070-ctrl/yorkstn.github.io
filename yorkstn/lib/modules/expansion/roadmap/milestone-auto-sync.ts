import { prisma } from '@/lib/db'

/**
 * Reads real state from Compliance, Partner Discovery, and this module's
 * own Sites/LaunchTasks — via well-scoped Prisma queries on each module's
 * own tables, per docs/phase3/retail-expansion-intelligence-engineering-
 * spec.md §4's orchestration rule — and updates each roadmap milestone's
 * status accordingly. Called on-demand from the roadmap GET route rather
 * than via a background job (no job runner exists yet — see
 * docs/phase2/TECH_STACK.md §7).
 */
export async function syncRoadmapMilestones(organizationId: string) {
  const roadmap = await prisma.expansionRoadmap.findUnique({
    where: { organizationId },
    include: { milestones: true },
  })
  if (!roadmap) return null

  const [complianceCase, acceptedIntroductions, totalSites, selectedSites, launchTasks] = await Promise.all([
    prisma.complianceCase.findUnique({
      where: { organizationId },
      include: { workflowItems: { where: { status: { not: 'not_applicable' } } } },
    }),
    prisma.introductionRequest.count({ where: { organizationId, status: 'accepted' } }),
    prisma.site.count({ where: { organizationId } }),
    prisma.site.count({ where: { organizationId, status: 'selected' } }),
    prisma.launchTask.findMany({ where: { organizationId } }),
  ])

  const entityFormationItem = complianceCase?.workflowItems.find(
    (i) => i.workflowType === 'entity_formation' && i.recommendedEntityType !== null,
  )
  const complianceItems = complianceCase?.workflowItems ?? []

  const statusFor: Record<string, 'not_started' | 'in_progress' | 'completed'> = {
    entity_formation: entityFormationItem?.status === 'completed' ? 'completed' : entityFormationItem ? 'in_progress' : 'not_started',
    compliance:
      complianceItems.length === 0
        ? 'not_started'
        : complianceItems.every((i) => i.status === 'completed')
          ? 'completed'
          : 'in_progress',
    partner_selection: acceptedIntroductions > 0 ? 'completed' : 'not_started',
    site_selection: selectedSites > 0 ? 'completed' : totalSites > 0 ? 'in_progress' : 'not_started',
    launch:
      launchTasks.length === 0
        ? 'not_started'
        : launchTasks.every((t) => t.status === 'done')
          ? 'completed'
          : 'in_progress',
  }

  await Promise.all(
    roadmap.milestones.map((milestone) => {
      const newStatus = statusFor[milestone.phase] ?? milestone.status
      if (newStatus === milestone.status) return Promise.resolve(milestone)
      return prisma.roadmapMilestone.update({ where: { id: milestone.id }, data: { status: newStatus } })
    }),
  )

  return prisma.expansionRoadmap.findUnique({
    where: { organizationId },
    include: { milestones: { orderBy: { createdAt: 'asc' } } },
  })
}
