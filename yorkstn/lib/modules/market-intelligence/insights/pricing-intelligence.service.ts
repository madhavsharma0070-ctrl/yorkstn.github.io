import { prisma } from '@/lib/db'
import { generateAndSaveInsight } from '../insight-generation.service'
import { lookupHsnCompliance } from '@/lib/modules/compliance/import/hsn-lookup.service'

/**
 * Feature spec 1.4 — US-13. Reads Compliance's HSN-based duty/labelling
 * signal through its exported `lookupHsnCompliance` function — never a raw
 * cross-module Prisma query (docs/phase3/ai-market-intelligence-
 * engineering-spec.md §1's module-boundary rule).
 */
export async function generatePricingIntelligence(organizationId: string, requestedByUserId?: string) {
  const [brandProfile, products] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { organizationId } }),
    prisma.product.findMany({ where: { organizationId, hsnCode: { not: null } }, take: 5 }),
  ])

  const dutySignals = products
    .filter((p): p is typeof p & { hsnCode: string } => p.hsnCode !== null)
    .map((p) => ({ product: p.name, ...lookupHsnCompliance(p.hsnCode) }))

  const tags = ['pricing', 'general', brandProfile?.category ?? 'general']

  const insight = await generateAndSaveInsight({
    organizationId,
    category: 'pricing_intelligence',
    inputParams: {
      category: brandProfile?.category,
      homeMarketPriceRange: brandProfile?.homeMarketPriceRange,
      dutySignals,
    },
    tags,
    requestedByUserId,
  })

  return insight
}
