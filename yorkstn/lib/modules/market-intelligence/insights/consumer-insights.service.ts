import { prisma } from '@/lib/db'
import { generateAndSaveInsight } from '../insight-generation.service'

// Feature spec 1.2 — US-11. Optionally scoped to a city (region-level insight).
export async function generateConsumerInsights(organizationId: string, cityId?: string, requestedByUserId?: string) {
  const [brandProfile, city] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { organizationId } }),
    cityId ? prisma.city.findUnique({ where: { id: cityId } }) : Promise.resolve(null),
  ])
  const tags = ['consumer', 'general', brandProfile?.category ?? 'general']

  return generateAndSaveInsight({
    organizationId,
    category: 'consumer_insights',
    cityId,
    inputParams: { category: brandProfile?.category, city: city?.name },
    tags,
    requestedByUserId,
  })
}
