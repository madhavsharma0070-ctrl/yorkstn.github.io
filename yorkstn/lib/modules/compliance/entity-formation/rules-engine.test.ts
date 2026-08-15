import { describe, it, expect } from 'vitest'
import { recommendEntityType, type EntityFormationInput } from './rules-engine'

const base: EntityFormationInput = {
  intendsCommercialActivity: true,
  hasSecuredSpecificContract: false,
  wantsSeparateIndianEntity: true,
  wantsLocalPartner: false,
  preferredEntityForm: 'company',
}

describe('recommendEntityType (deterministic rules engine, AC US-20)', () => {
  it('recommends Liaison Office when no commercial activity is planned', () => {
    const result = recommendEntityType({ ...base, intendsCommercialActivity: false })
    expect(result.recommendedEntityType).toBe('liaison')
  })

  it('recommends Project Office when a specific contract is already secured', () => {
    const result = recommendEntityType({ ...base, hasSecuredSpecificContract: true })
    expect(result.recommendedEntityType).toBe('project_office')
  })

  it('recommends Branch Office when no separate Indian entity is wanted', () => {
    const result = recommendEntityType({ ...base, wantsSeparateIndianEntity: false })
    expect(result.recommendedEntityType).toBe('branch')
  })

  it('recommends LLP when an LLP structure is preferred', () => {
    const result = recommendEntityType({ ...base, preferredEntityForm: 'llp' })
    expect(result.recommendedEntityType).toBe('llp')
  })

  it('recommends JV when a local partner is wanted', () => {
    const result = recommendEntityType({ ...base, wantsLocalPartner: true })
    expect(result.recommendedEntityType).toBe('jv')
  })

  it('recommends WOS as the default full-ownership company case', () => {
    const result = recommendEntityType(base)
    expect(result.recommendedEntityType).toBe('wos')
  })

  it('is deterministic: identical input always produces an identical result', () => {
    const a = recommendEntityType(base)
    const b = recommendEntityType(base)
    expect(a).toEqual(b)
  })

  it('every result includes a non-empty rationale and the current rule engine version', () => {
    const result = recommendEntityType(base)
    expect(result.rationale.length).toBeGreaterThan(0)
    expect(result.ruleEngineVersion).toBe('entity-formation-rules-v1')
  })
})
