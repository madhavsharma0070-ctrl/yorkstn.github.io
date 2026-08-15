import { describe, it, expect } from 'vitest'
import { MockAiProvider } from './mock-provider'
import { retrieve } from '../retrieval/corpus-index'

describe('MockAiProvider', () => {
  const provider = new MockAiProvider()

  it('returns insufficient_data with no sources when retrieval found nothing', async () => {
    const result = await provider.generate({
      category: 'market_analysis',
      inputParams: {},
      retrievalContext: [],
    })
    expect(result.confidence).toBe('insufficient_data')
    expect(result.sources).toEqual([])
  })

  it('never claims high confidence — it is seed data, not a verified feed', async () => {
    const hits = retrieve(['general'])
    const result = await provider.generate({
      category: 'market_analysis',
      inputParams: { category: 'fashion' },
      retrievalContext: hits,
    })
    expect(result.confidence).not.toBe('high')
    expect(result.confidence).toBe('medium')
  })

  it('every source in the output traces to an actual retrieved hit', async () => {
    const hits = retrieve(['pricing'])
    const result = await provider.generate({
      category: 'pricing_intelligence',
      inputParams: {},
      retrievalContext: hits,
    })
    expect(result.sources.map((s) => s.title)).toEqual(hits.map((h) => h.title))
  })

  it('conforms to the AI Output Standard shape', async () => {
    const result = await provider.generate({
      category: 'consumer_insights',
      inputParams: {},
      retrievalContext: retrieve(['consumer']),
    })
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('sources')
    expect(result).toHaveProperty('assumptions')
    expect(result).toHaveProperty('generatedAt')
    expect(result).toHaveProperty('modelVersion', 'mock-v1')
  })
})
