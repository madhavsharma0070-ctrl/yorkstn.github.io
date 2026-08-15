import { describe, it, expect } from 'vitest'
import { calculateReadinessScore, type ReadinessScoreInputs } from './scoring-engine'

const zeroInputs: ReadinessScoreInputs = {
  complianceCompletionPct: 0,
  hasMarketAnalysis: false,
  hasCityRecommendation: false,
  hasPricingIntelligence: false,
  hasSecuredBudget: false,
  hasDefinedTimeline: false,
}

const fullInputs: ReadinessScoreInputs = {
  complianceCompletionPct: 100,
  hasMarketAnalysis: true,
  hasCityRecommendation: true,
  hasPricingIntelligence: true,
  hasSecuredBudget: true,
  hasDefinedTimeline: true,
}

describe('calculateReadinessScore (AC US-16)', () => {
  it('scores 0 when nothing is done', () => {
    expect(calculateReadinessScore(zeroInputs).totalScore).toBe(0)
  })

  it('scores 100 when everything is complete', () => {
    expect(calculateReadinessScore(fullInputs).totalScore).toBe(100)
  })

  it('is deterministic: identical input always produces an identical result', () => {
    const a = calculateReadinessScore(fullInputs)
    const b = calculateReadinessScore(fullInputs)
    expect(a).toEqual(b)
  })

  it('driver points always sum to the total score', () => {
    const partial: ReadinessScoreInputs = {
      complianceCompletionPct: 50,
      hasMarketAnalysis: true,
      hasCityRecommendation: false,
      hasPricingIntelligence: true,
      hasSecuredBudget: true,
      hasDefinedTimeline: false,
    }
    const result = calculateReadinessScore(partial)
    const driverSum = result.drivers.reduce((sum, d) => sum + d.pointsEarned, 0)
    expect(Math.round(driverSum)).toBe(result.totalScore)
  })

  it('compliance completion percentage scales the compliance driver proportionally', () => {
    const half = calculateReadinessScore({ ...zeroInputs, complianceCompletionPct: 50 })
    const complianceDriver = half.drivers.find((d) => d.driverName === 'compliance')
    expect(complianceDriver?.pointsEarned).toBe(20) // 50% of 40 possible points
  })
})
