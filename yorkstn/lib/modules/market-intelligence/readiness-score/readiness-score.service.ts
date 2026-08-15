import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { calculateReadinessScore, type ReadinessScoreInputs } from './scoring-engine'
import { collectReadinessScoreInputs } from './inputs-collector'

export async function recalculateReadinessScore(
  organizationId: string,
  capitalInputs: { hasSecuredBudget: boolean; hasDefinedTimeline: boolean },
) {
  const inputs: ReadinessScoreInputs = await collectReadinessScoreInputs(organizationId, capitalInputs)
  const result = calculateReadinessScore(inputs)

  return prisma.expansionReadinessScore.create({
    data: {
      organizationId,
      score: result.totalScore,
      inputsSnapshot: inputs as unknown as Prisma.InputJsonValue,
      ruleEngineVersion: result.ruleEngineVersion,
      drivers: { create: result.drivers },
    },
    include: { drivers: true },
  })
}

export async function getLatestReadinessScore(organizationId: string) {
  return prisma.expansionReadinessScore.findFirst({
    where: { organizationId },
    orderBy: { calculatedAt: 'desc' },
    include: { drivers: true },
  })
}
