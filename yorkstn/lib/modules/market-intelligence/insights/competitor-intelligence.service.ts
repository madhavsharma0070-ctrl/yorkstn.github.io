import { prisma } from '@/lib/db'
import { generateAndSaveInsight } from '../insight-generation.service'

// Feature spec 1.3 — US-12.
export async function generateCompetitorIntelligence(organizationId: string, requestedByUserId?: string) {
  const brandProfile = await prisma.brandProfile.findUnique({ where: { organizationId } })
  const tags = ['competitors', 'general', brandProfile?.category ?? 'general']

  return generateAndSaveInsight({
    organizationId,
    category: 'competitor_intelligence',
    inputParams: { category: brandProfile?.category },
    tags,
    requestedByUserId,
  })
}
