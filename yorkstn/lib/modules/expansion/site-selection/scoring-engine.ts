import { scoreDistributionMaturity } from '@/lib/modules/market-intelligence/city-recommendations.service'

/**
 * Site Selection scoring (US-42, AC US-42) — deterministic, pure, no I/O,
 * never AI-generated (DECISIONS.md D-04, the third instance of this
 * pattern alongside the Readiness Score and City Recommendations).
 */

export interface SiteScoringWeights {
  footfall: number
  rent: number
  competitive_density: number
  distribution_maturity: number
}

export const DEFAULT_SITE_WEIGHTS: SiteScoringWeights = {
  footfall: 0.3,
  rent: 0.3,
  competitive_density: 0.2,
  distribution_maturity: 0.2,
}

export interface SiteAttributes {
  /** 0-100 user estimate/benchmark; higher is better. */
  footfallScore?: number
  /** 0-100; higher = more expensive (inverted in scoring — lower rent is better). */
  rentScore?: number
  /** 0-100; higher = more competitively saturated (inverted — lower is better). */
  competitiveDensityScore?: number
}

export interface SiteScoreBreakdown {
  footfall: number
  rent: number
  competitiveDensity: number
  distributionMaturity: number
}

export function computeSiteScore(
  attributes: SiteAttributes,
  cityDistributionMaturity: unknown,
  weights: SiteScoringWeights,
): { score: number; breakdown: SiteScoreBreakdown } {
  const weightSum = weights.footfall + weights.rent + weights.competitive_density + weights.distribution_maturity
  const w = weightSum > 0 ? weights : DEFAULT_SITE_WEIGHTS
  const normalizer = weightSum > 0 ? weightSum : 1

  const footfall = attributes.footfallScore ?? 0
  const rent = 100 - (attributes.rentScore ?? 100) // missing rent data scores as "expensive" (conservative), not free
  const competitiveDensity = 100 - (attributes.competitiveDensityScore ?? 50)
  const distributionMaturity = scoreDistributionMaturity(cityDistributionMaturity).score

  const breakdown: SiteScoreBreakdown = { footfall, rent, competitiveDensity, distributionMaturity }

  const score = Math.round(
    (w.footfall * footfall + w.rent * rent + w.competitive_density * competitiveDensity + w.distribution_maturity * distributionMaturity) /
      normalizer,
  )

  return { score, breakdown }
}
