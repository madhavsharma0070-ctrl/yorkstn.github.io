import { describe, it, expect } from 'vitest'
import { lookupHsnCompliance } from './hsn-lookup.service'

describe('lookupHsnCompliance', () => {
  it('identifies apparel (chapter 61) as not BIS-covered but Legal-Metrology-labelled', () => {
    const result = lookupHsnCompliance('610910')
    expect(result.chapter).toBe('61')
    expect(result.requiresBis).toBe(false)
    expect(result.requiresLegalMetrologyLabel).toBe(true)
  })

  it('identifies toys (chapter 95) as requiring BIS CRS', () => {
    const result = lookupHsnCompliance('950300')
    expect(result.requiresBis).toBe(true)
    expect(result.bisScheme).toBe('CRS')
  })

  it('identifies cosmetics (chapter 33) as requiring BIS FMCS', () => {
    const result = lookupHsnCompliance('330499')
    expect(result.requiresBis).toBe(true)
    expect(result.bisScheme).toBe('FMCS')
  })

  it('returns a "requires further validation" result for an unknown chapter, never fabricating a specific requirement', () => {
    const result = lookupHsnCompliance('999999')
    expect(result.notes).toMatch(/requires further validation/i)
  })

  it('is deterministic', () => {
    expect(lookupHsnCompliance('610910')).toEqual(lookupHsnCompliance('610910'))
  })
})
