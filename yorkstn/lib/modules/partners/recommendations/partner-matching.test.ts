import { describe, it, expect } from 'vitest'
import { computeMatchScore } from './partner-matching.service'

describe('computeMatchScore', () => {
  it('scores highest when the partner serves a target city', () => {
    expect(computeMatchScore(true, true)).toBe(100)
  })

  it('scores lower when target cities exist but this partner does not serve any of them', () => {
    expect(computeMatchScore(false, true)).toBe(50)
  })

  it('gives a neutral middle score when no target cities are known yet (no City Recommendation generated)', () => {
    expect(computeMatchScore(false, false)).toBe(75)
  })

  it('is deterministic', () => {
    expect(computeMatchScore(true, true)).toBe(computeMatchScore(true, true))
  })
})
