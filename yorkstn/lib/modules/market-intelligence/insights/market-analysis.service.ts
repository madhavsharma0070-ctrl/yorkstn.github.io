import { prisma } from '@/lib/db'
import { generateAndSaveInsight } from '../insight-generation.service'

// Feature spec 1.1 — US-10.
export async function generateMarketAnalysis(organizationId: string, requestedByUserId?: string) {
  const brandProfile = await prisma.brandProfile.findUnique({ where: { organizationId } })
  const tags = ['general', brandProfile?.category ?? 'general']

  return generateAndSaveInsight({
    organizationId,
    category: 'market_analysis',
    inputParams: { category: brandProfile?.category, priceTier: brandProfile?.priceTier },
    tags,
    requestedByUserId,
  })
}
