/**
 * HSN-code-keyed compliance lookup — a Category (b) curated/structured
 * table per docs/phase2/AI_ARCHITECTURE.md, deliberately NOT an AI/LLM
 * call: BIS/QCO applicability and import-documentation requirements are
 * facts with a definite correct answer, not something to ask a model to
 * "know." Matched at the 2-digit HS chapter level — real HSN classification
 * is 6+ digits and product-specific; this is a curated seed set covering
 * chapters relevant to Yorkstn's ICP (fashion/kids/beauty/home-living),
 * explicitly NOT exhaustive (research found BIS QCOs span 679+ categories).
 * Every entry's applicability should be re-verified against the live BIS/
 * DGFT/CBIC sources before being relied on for a real filing — see
 * docs/phase2/VALIDATION_PLAN.md §4.
 */

export interface HsnLookupResult {
  chapter: string
  description: string
  requiresBis: boolean
  bisScheme: 'FMCS' | 'CRS' | null
  requiresLegalMetrologyLabel: boolean
  notes: string
  sourceUrl: string
  confidence: 'curated-seed-data'
}

const SOURCE =
  'https://github.com/madhavsharma0070-ctrl/yorkstn.github.io/blob/main/research/india-market-entry-regulatory-landscape.md'

const HSN_CHAPTER_TABLE: Record<string, Omit<HsnLookupResult, 'chapter' | 'sourceUrl' | 'confidence'>> = {
  '61': {
    description: 'Apparel and clothing accessories, knitted or crocheted',
    requiresBis: false,
    bisScheme: null,
    requiresLegalMetrologyLabel: true,
    notes: 'Not BIS-QCO-covered as a general category; Legal Metrology labelling (MRP, country of origin, importer details) applies to all retail packaged imports.',
  },
  '62': {
    description: 'Apparel and clothing accessories, not knitted or crocheted',
    requiresBis: false,
    bisScheme: null,
    requiresLegalMetrologyLabel: true,
    notes: 'Same as Chapter 61 — Legal Metrology labelling applies; no general BIS QCO for apparel.',
  },
  '64': {
    description: 'Footwear',
    requiresBis: true,
    bisScheme: 'CRS',
    requiresLegalMetrologyLabel: true,
    notes: 'Certain footwear categories fall under BIS Compulsory Registration/QCO — confirm the exact product\'s current QCO status directly with BIS before import.',
  },
  '33': {
    description: 'Essential oils, cosmetics, personal care preparations',
    requiresBis: true,
    bisScheme: 'FMCS',
    requiresLegalMetrologyLabel: true,
    notes: 'Cosmetics are regulated (historically via the Cosmetics Rules under the Drugs & Cosmetics framework, with BIS/FMCS certification relevant for specific product standards) — requires further validation against current CDSCO/BIS rules for the specific product.',
  },
  '94': {
    description: 'Furniture, bedding, lighting fittings, home furnishings',
    requiresBis: false,
    bisScheme: null,
    requiresLegalMetrologyLabel: true,
    notes: 'Electrical lighting/fittings items may separately fall under BIS CRS for electronics/IT goods (see Chapter 85) — check the specific product.',
  },
  '95': {
    description: 'Toys, games, and sports requisites',
    requiresBis: true,
    bisScheme: 'CRS',
    requiresLegalMetrologyLabel: true,
    notes: 'Toys are BIS-QCO-covered under the Toys (Quality Control) Order — mandatory ISI marking applies to most categories.',
  },
  '85': {
    description: 'Electrical machinery and electronic equipment',
    requiresBis: true,
    bisScheme: 'CRS',
    requiresLegalMetrologyLabel: true,
    notes: 'Broad BIS CRS coverage for electronics/IT/telecom goods — confirm the specific product against the current CRS list.',
  },
}

export function lookupHsnCompliance(hsnCode: string): HsnLookupResult {
  const chapter = hsnCode.replace(/\D/g, '').slice(0, 2)
  const entry = HSN_CHAPTER_TABLE[chapter]

  if (!entry) {
    return {
      chapter,
      description: 'No curated entry for this HSN chapter yet.',
      requiresBis: false,
      bisScheme: null,
      requiresLegalMetrologyLabel: true, // safe default: Legal Metrology labelling applies broadly to retail packaged imports
      notes: 'Requires further validation — this HSN chapter is not yet in Yorkstn\'s curated compliance table. Confirm BIS/DGFT/CBIC applicability directly before import.',
      sourceUrl: SOURCE,
      confidence: 'curated-seed-data',
    }
  }

  return { chapter, sourceUrl: SOURCE, confidence: 'curated-seed-data', ...entry }
}
