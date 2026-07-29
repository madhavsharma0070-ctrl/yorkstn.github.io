import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'
import { computeSiteScore, DEFAULT_SITE_WEIGHTS, type SiteAttributes, type SiteScoringWeights } from './scoring-engine'

export async function listSites(organizationId: string) {
  return prisma.site.findMany({
    where: { organizationId },
    include: { city: true, mall: true },
    orderBy: { computedScore: 'desc' },
  })
}

async function getWeights(organizationId: string): Promise<SiteScoringWeights> {
  const config = await prisma.siteScoringConfig.findUnique({ where: { organizationId } })
  return (config?.weights as unknown as SiteScoringWeights) ?? DEFAULT_SITE_WEIGHTS
}

async function scoreAndPersist(siteId: string, cityId: string, attributes: SiteAttributes, weights: SiteScoringWeights) {
  const city = await prisma.city.findUniqueOrThrow({ where: { id: cityId } })
  const { score, breakdown } = computeSiteScore(attributes, city.distributionMaturity, weights)

  return prisma.site.update({
    where: { id: siteId },
    data: {
      computedScore: score,
      scoreBreakdown: breakdown as unknown as Prisma.InputJsonValue,
    },
  })
}

export interface CreateSiteInput {
  cityId: string
  mallId?: string
  crePartnerId?: string
  name: string
  address?: string
  attributes: SiteAttributes
}

export async function createSite(organizationId: string, input: CreateSiteInput) {
  const weights = await getWeights(organizationId)
  const city = await prisma.city.findUniqueOrThrow({ where: { id: input.cityId } })
  const { score, breakdown } = computeSiteScore(input.attributes, city.distributionMaturity, weights)

  return prisma.site.create({
    data: {
      organizationId,
      cityId: input.cityId,
      mallId: input.mallId,
      crePartnerId: input.crePartnerId,
      name: input.name,
      address: input.address,
      attributes: input.attributes as unknown as Prisma.InputJsonValue,
      computedScore: score,
      scoreBreakdown: breakdown as unknown as Prisma.InputJsonValue,
    },
  })
}

export interface UpdateSiteInput {
  status?: string
  attributes?: SiteAttributes
}

export async function updateSite(organizationId: string, siteId: string, input: UpdateSiteInput) {
  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site || site.organizationId !== organizationId) throw new NotFoundError('Site not found.')

  if (input.attributes) {
    const weights = await getWeights(organizationId)
    await scoreAndPersist(siteId, site.cityId, input.attributes, weights)
  }

  return prisma.site.update({
    where: { id: siteId },
    data: {
      status: input.status,
      attributes: input.attributes ? (input.attributes as unknown as Prisma.InputJsonValue) : undefined,
    },
  })
}

/** US-42: updating the scoring weights recomputes every site's score (AC's "reproducible from the same weights" requirement). */
export async function updateScoringWeights(organizationId: string, weights: SiteScoringWeights) {
  await prisma.siteScoringConfig.upsert({
    where: { organizationId },
    create: { organizationId, weights: weights as unknown as Prisma.InputJsonValue },
    update: { weights: weights as unknown as Prisma.InputJsonValue },
  })

  const sites = await prisma.site.findMany({ where: { organizationId } })
  await Promise.all(
    sites.map((site) => scoreAndPersist(site.id, site.cityId, (site.attributes as SiteAttributes) ?? {}, weights)),
  )

  return listSites(organizationId)
}
