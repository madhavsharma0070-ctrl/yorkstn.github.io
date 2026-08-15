import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  generateAndSaveInsight,
  getLatestInsight,
} from '@/lib/modules/market-intelligence/insight-generation.service'

/**
 * AI Partner Recommendations (feature spec 3.3). Split deterministic-
 * signals + AI-narrative, exactly like City Recommendations
 * (docs/phase3/partner-discovery-engineering-spec.md §1) — WHICH partners
 * match is a deterministic computation over real data, never left to the
 * AI provider to invent; only the human-readable rationale is generated.
 *
 * "Target cities" are read from the org's own latest City Recommendation
 * insight (Milestone 5) via the exported `getLatestInsight` function — a
 * real cross-module read done the right way, never a raw query into
 * another module's tables. If no City Recommendation has been generated
 * yet, this falls back to all verified partners (no city filter) rather
 * than returning nothing.
 */

interface PartnerMatch {
  partnerId: string
  businessName: string
  category: string
  matchScore: number
  matchingSignals: { cityMatch: boolean; verified: boolean }
}

/** Pure — extracted for unit testing (all candidates are pre-filtered to verified=true). */
export function computeMatchScore(cityMatch: boolean, hasTargetCities: boolean): number {
  const cityComponent = cityMatch ? 50 : hasTargetCities ? 0 : 25
  const verifiedComponent = 50
  return cityComponent + verifiedComponent
}

export async function generatePartnerRecommendations(organizationId: string, requestedByUserId?: string) {
  const cityInsight = await getLatestInsight(organizationId, 'city_recommendation')
  const rankedCities = (cityInsight?.structuredOutput as { rankedCities?: { cityId: string }[] } | null)
    ?.rankedCities
  const targetCityIds = rankedCities?.slice(0, 3).map((c) => c.cityId) ?? []

  const candidates = await prisma.partner.findMany({
    where: { verificationStatus: 'verified', deletedAt: null },
    include: { cities: true },
  })

  const matches: PartnerMatch[] = candidates
    .map((partner) => {
      const cityMatch = targetCityIds.length > 0 && partner.cities.some((pc) => targetCityIds.includes(pc.cityId))
      return {
        partnerId: partner.id,
        businessName: partner.businessName,
        category: partner.category,
        matchScore: computeMatchScore(cityMatch, targetCityIds.length > 0),
        matchingSignals: { cityMatch, verified: true },
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)

  const insight = await generateAndSaveInsight({
    organizationId,
    category: 'partner_recommendation',
    inputParams: { targetCityCount: targetCityIds.length, candidateCount: candidates.length },
    tags: ['general'],
    requestedByUserId,
  })

  return prisma.aiInsight.update({
    where: { id: insight.id },
    data: {
      structuredOutput: {
        ...(insight.structuredOutput as object),
        matches,
      } as unknown as Prisma.InputJsonValue,
    },
    include: { sources: true },
  })
}
