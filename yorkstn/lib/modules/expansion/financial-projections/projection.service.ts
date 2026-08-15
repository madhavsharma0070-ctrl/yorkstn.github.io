import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Feature spec 4.5 — US-44, AC US-44. `userAssumptions` and
 * `platformBenchmarks` are stored and returned as structurally SEPARATE
 * fields, never merged into one blended number — the PRD's non-goal
 * against presenting speculative financials as fact (docs/phase3/retail-
 * expansion-intelligence-engineering-spec.md §5).
 */

export interface LineItemInput {
  label: string
  amount: number
  sourceType: 'user_input' | 'platform_benchmark'
}

export interface CreateProjectionInput {
  cityId?: string
  horizonMonths: number
  lineItems: LineItemInput[]
}

export async function createProjection(organizationId: string, input: CreateProjectionInput) {
  const userAssumptions = input.lineItems.filter((li) => li.sourceType === 'user_input')
  const platformBenchmarks = input.lineItems.filter((li) => li.sourceType === 'platform_benchmark')

  return prisma.financialProjection.create({
    data: {
      organizationId,
      cityId: input.cityId,
      horizonMonths: input.horizonMonths,
      userAssumptions: userAssumptions as unknown as Prisma.InputJsonValue,
      platformBenchmarks: platformBenchmarks as unknown as Prisma.InputJsonValue,
      lineItems: { create: input.lineItems },
    },
    include: { lineItems: true },
  })
}

export async function listProjections(organizationId: string) {
  return prisma.financialProjection.findMany({
    where: { organizationId },
    include: { lineItems: true },
    orderBy: { createdAt: 'desc' },
  })
}
