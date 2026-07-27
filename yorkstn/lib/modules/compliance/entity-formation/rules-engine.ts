import type { EntityTypeRec } from '@/lib/validation/enums'

/**
 * Deterministic entity-formation recommendation engine (US-20, AC US-20).
 * Pure function — no I/O, no AI call — per DECISIONS.md D-04 and
 * docs/phase3/compliance-operating-system-engineering-spec.md §4: this is
 * the highest-consequence deterministic decision in the product (a real
 * legal-structure recommendation), so it must be reproducible and
 * versioned, never generative.
 *
 * Decision logic sourced from
 * research/india-market-entry-regulatory-landscape.md §2.
 */

export const ENTITY_FORMATION_RULE_ENGINE_VERSION = 'entity-formation-rules-v1'

export interface EntityFormationInput {
  /** False => the brand plans no revenue-generating activity yet (pure market scoping). */
  intendsCommercialActivity: boolean
  /** True => a specific contract/project has already been secured with an Indian entity. */
  hasSecuredSpecificContract: boolean
  /** False => the brand wants to operate as an extension of the foreign parent, not a separate Indian entity. */
  wantsSeparateIndianEntity: boolean
  /** True => the brand wants an Indian equity partner (joint venture) rather than full ownership. */
  wantsLocalPartner: boolean
  /** Preference between a private limited company and an LLP structure. */
  preferredEntityForm: 'company' | 'llp'
}

export interface EntityFormationResult {
  recommendedEntityType: EntityTypeRec
  rationale: string
  ruleEngineVersion: string
}

export function recommendEntityType(input: EntityFormationInput): EntityFormationResult {
  const ruleEngineVersion = ENTITY_FORMATION_RULE_ENGINE_VERSION

  if (!input.intendsCommercialActivity) {
    return {
      recommendedEntityType: 'liaison',
      ruleEngineVersion,
      rationale:
        'You indicated no revenue-generating or commercial activity is planned yet. A Liaison Office is the appropriate representative-only structure for market scoping — it cannot invoice or contract in India, and all local expenses must be funded by inward remittance from the foreign parent (research/india-market-entry-regulatory-landscape.md §2).',
    }
  }

  if (input.hasSecuredSpecificContract) {
    return {
      recommendedEntityType: 'project_office',
      ruleEngineVersion,
      rationale:
        'You indicated a specific contract with an Indian entity has already been secured. A Project Office is the entity type designed for executing a defined, contracted project, and is temporary/project-scoped rather than a general operating presence.',
    }
  }

  if (!input.wantsSeparateIndianEntity) {
    return {
      recommendedEntityType: 'branch',
      ruleEngineVersion,
      rationale:
        'You indicated commercial activity is planned but you do not want a legally separate Indian entity. A Branch Office can generate revenue, invoice, and contract in India, but remains legally an extension of the foreign parent, with permitted activities constrained by RBI approval terms.',
    }
  }

  if (input.preferredEntityForm === 'llp') {
    return {
      recommendedEntityType: 'llp',
      ruleEngineVersion,
      rationale:
        'You indicated a preference for a partnership structure over a company. A Limited Liability Partnership (LLP) is available to foreign companies/nationals under the LLP Act, 2008, subject to sectoral FDI conditions and at least one resident designated partner.',
    }
  }

  if (input.wantsLocalPartner) {
    return {
      recommendedEntityType: 'jv',
      ruleEngineVersion,
      rationale:
        'You indicated a preference for an Indian equity partner. A Joint Venture (incorporated as a private limited company under the Companies Act, 2013, with a local partner) gives full operating flexibility while sharing ownership and local market knowledge.',
    }
  }

  return {
    recommendedEntityType: 'wos',
    ruleEngineVersion,
    rationale:
      'You indicated commercial activity, a separate Indian entity, full ownership, and a company (not LLP) structure. A Wholly Owned Subsidiary (private limited company under the Companies Act, 2013) is the standard vehicle for a brand intending to actually trade, retail, or manufacture in India with full operating flexibility.',
  }
}
