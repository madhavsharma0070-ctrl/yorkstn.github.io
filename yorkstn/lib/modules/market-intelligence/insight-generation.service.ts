import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getAiProvider } from './ai-provider'
import { retrieve } from './retrieval/corpus-index'
import type { AiInsightCategory } from './ai-provider/types'

/**
 * Shared generation+persistence path for every Market Intelligence feature
 * that follows the AI Output Standard (market analysis, consumer insights,
 * competitor intelligence, pricing intelligence, demand forecast, city
 * recommendations — docs/phase3/ai-market-intelligence-engineering-spec.md
 * §1). One function instead of five near-duplicates, mirroring
 * DATABASE_SCHEMA.md's rationale for one polymorphic `ai_insights` table.
 *
 * Deliberately NOT used by the Expansion Readiness Score or Entity
 * Formation recommendation — those are deterministic (DECISIONS.md D-04)
 * and must never go through an AiProvider call.
 */

interface GenerateInsightParams {
  organizationId: string
  category: AiInsightCategory
  cityId?: string
  inputParams: Record<string, unknown>
  tags: string[]
  requestedByUserId?: string
  methodologyNote?: string
}

export async function generateAndSaveInsight(params: GenerateInsightParams) {
  const retrievalContext = retrieve(params.tags)
  const output = await getAiProvider().generate({
    category: params.category,
    inputParams: params.inputParams,
    retrievalContext,
  })

  return prisma.aiInsight.create({
    data: {
      organizationId: params.organizationId,
      category: params.category,
      cityId: params.cityId,
      inputParams: params.inputParams as Prisma.InputJsonValue,
      summary: output.summary,
      confidence: output.confidence,
      structuredOutput: output.structuredOutput as Prisma.InputJsonValue,
      assumptions: output.assumptions as unknown as Prisma.InputJsonValue,
      methodologyNote: params.methodologyNote,
      generatedAt: new Date(output.generatedAt),
      modelVersion: output.modelVersion,
      requestedByUserId: params.requestedByUserId,
      sources: {
        create: output.sources.map((s) => ({
          title: s.title,
          url: s.url,
          retrievedDate: new Date(s.retrievedDate),
        })),
      },
    },
    include: { sources: true },
  })
}

/** Latest-per-category lookup — the dominant read pattern (DATABASE_SCHEMA.md §1.3's index). */
export async function getLatestInsight(organizationId: string, category: AiInsightCategory, cityId?: string) {
  return prisma.aiInsight.findFirst({
    where: { organizationId, category, ...(cityId ? { cityId } : {}) },
    orderBy: { generatedAt: 'desc' },
    include: { sources: true },
  })
}

export async function insightExists(organizationId: string, category: AiInsightCategory): Promise<boolean> {
  const count = await prisma.aiInsight.count({ where: { organizationId, category } })
  return count > 0
}
