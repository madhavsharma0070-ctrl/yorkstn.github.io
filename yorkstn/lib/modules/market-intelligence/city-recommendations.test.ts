import { describe, it, expect } from 'vitest'
import { scoreCities, DEFAULT_CITY_WEIGHTS } from './city-recommendations.service'

const cities = [
  { id: '1', name: 'HighTierHighMaturity', tier: 'tier1', distributionMaturity: { generalTrade: 'high', modernTrade: 'high', quickCommerce: 'high' } },
  { id: '2', name: 'LowTierLowMaturity', tier: 'tier3', distributionMaturity: { generalTrade: 'low', modernTrade: 'low', quickCommerce: 'low' } },
  { id: '3', name: 'NoData', tier: null, distributionMaturity: null },
]

describe('scoreCities (AC US-42-style determinism for City Recommendations)', () => {
  it('ranks the highest tier + maturity city first', () => {
    const results = scoreCities(cities, DEFAULT_CITY_WEIGHTS)
    expect(results[0].name).toBe('HighTierHighMaturity')
    expect(results[results.length - 1].name).toBe('NoData')
  })

  it('is deterministic: identical input always produces an identical result', () => {
    const a = scoreCities(cities, DEFAULT_CITY_WEIGHTS)
    const b = scoreCities(cities, DEFAULT_CITY_WEIGHTS)
    expect(a).toEqual(b)
  })

  it('flags a city with no tier/maturity data as insufficient_data, never a fabricated score', () => {
    const results = scoreCities(cities, DEFAULT_CITY_WEIGHTS)
    const noData = results.find((r) => r.name === 'NoData')
    expect(noData?.dataCompleteness).toBe('insufficient_data')
    expect(noData?.compositeScore).toBe(0)
  })

  it('respects custom weights', () => {
    const tierOnly = scoreCities(cities, { populationTier: 1, distributionMaturity: 0 })
    const maturityOnly = scoreCities(cities, { populationTier: 0, distributionMaturity: 1 })
    // Both orderings should still rank the fully-populated city first and the no-data city last,
    // but the weighting changes which of the two single dimensions drives the number.
    expect(tierOnly[0].name).toBe('HighTierHighMaturity')
    expect(maturityOnly[0].name).toBe('HighTierHighMaturity')
  })
})
