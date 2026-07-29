import { describe, it, expect } from 'vitest'
import { computeSiteScore, DEFAULT_SITE_WEIGHTS } from './scoring-engine'

const highMaturity = { generalTrade: 'high', modernTrade: 'high', quickCommerce: 'high' }

describe('computeSiteScore (AC US-42)', () => {
  it('scores a great site (high footfall, low rent, low competition, high maturity) near 100', () => {
    const { score } = computeSiteScore(
      { footfallScore: 100, rentScore: 0, competitiveDensityScore: 0 },
      highMaturity,
      DEFAULT_SITE_WEIGHTS,
    )
    expect(score).toBe(100)
  })

  it('scores a poor site (low footfall, high rent, high competition, no maturity data) near 0', () => {
    const { score } = computeSiteScore(
      { footfallScore: 0, rentScore: 100, competitiveDensityScore: 100 },
      null,
      DEFAULT_SITE_WEIGHTS,
    )
    expect(score).toBe(0)
  })

  it('is deterministic: identical input always produces an identical result', () => {
    const input = { footfallScore: 70, rentScore: 40, competitiveDensityScore: 30 }
    const a = computeSiteScore(input, highMaturity, DEFAULT_SITE_WEIGHTS)
    const b = computeSiteScore(input, highMaturity, DEFAULT_SITE_WEIGHTS)
    expect(a).toEqual(b)
  })

  it('missing rent data is treated conservatively (as expensive), not as free', () => {
    const withData = computeSiteScore({ footfallScore: 50, rentScore: 100, competitiveDensityScore: 50 }, null, DEFAULT_SITE_WEIGHTS)
    const withoutData = computeSiteScore({ footfallScore: 50, competitiveDensityScore: 50 }, null, DEFAULT_SITE_WEIGHTS)
    expect(withoutData.score).toBe(withData.score)
  })
})
