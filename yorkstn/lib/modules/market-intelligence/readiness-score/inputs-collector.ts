import { prisma } from '@/lib/db'
import { insightExists } from '../insight-generation.service'
import type { ReadinessScoreInputs } from './scoring-engine'

/**
 * Gathers the REAL inputs the deterministic scoring engine needs. This is
 * the one place allowed to read across modules for the Readiness Score —
 * it does so only through each module's own exported functions
 * (`insightExists`) or well-scoped Prisma queries on this module's own
 * data, never a raw cross-module join (docs/phase3/ai-market-intelligence-
 * engineering-spec.md §1's boundary rule).
 *
 * `hasSecuredBudget`/`hasDefinedTimeline` have no dedicated DB field yet —
 * there is no capital-readiness questionnaire model in MVP — so they are
 * accepted as caller-supplied booleans (from the API request body) rather
 * than silently defaulted to a fixed value; this is documented, not hidden.
 */
export async function collectReadinessScoreInputs(
  organizationId: string,
  capitalInputs: { hasSecuredBudget: boolean; hasDefinedTimeline: boolean },
): Promise<ReadinessScoreInputs> {
  const complianceCase = await prisma.complianceCase.findUnique({
    where: { organizationId },
    include: { workflowItems: { where: { status: { not: 'not_applicable' } } } },
  })

  const items = complianceCase?.workflowItems ?? []
  const complianceCompletionPct =
    items.length === 0 ? 0 : Math.round((items.filter((i) => i.status === 'completed').length / items.length) * 100)

  const [hasMarketAnalysis, hasCityRecommendation, hasPricingIntelligence] = await Promise.all([
    insightExists(organizationId, 'market_analysis'),
    insightExists(organizationId, 'city_recommendation'),
    insightExists(organizationId, 'pricing_intelligence'),
  ])

  return {
    complianceCompletionPct,
    hasMarketAnalysis,
    hasCityRecommendation,
    hasPricingIntelligence,
    hasSecuredBudget: capitalInputs.hasSecuredBudget,
    hasDefinedTimeline: capitalInputs.hasDefinedTimeline,
  }
}
