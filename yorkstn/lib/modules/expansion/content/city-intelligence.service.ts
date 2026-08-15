import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'

// Feature spec 4.1 — US-40. Reference/content data, not org-scoped
// (DECISIONS.md D-14) — every authenticated org can view any city's detail.
export async function getCityIntelligence(cityId: string) {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: { malls: true },
  })
  if (!city) throw new NotFoundError('City not found.')
  return city
}

export async function listCities() {
  return prisma.city.findMany({ orderBy: { name: 'asc' } })
}
