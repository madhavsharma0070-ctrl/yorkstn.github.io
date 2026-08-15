import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'

// Feature spec 4.2 — US-41.
export async function getMallIntelligence(mallId: string) {
  const mall = await prisma.mall.findUnique({
    where: { id: mallId },
    include: { city: true },
  })
  if (!mall) throw new NotFoundError('Mall not found.')
  return mall
}
