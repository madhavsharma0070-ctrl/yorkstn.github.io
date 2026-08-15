import { prisma } from '@/lib/db'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Appends -2, -3, ... until the slug is unique, since organizations.slug is unique. */
export async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name) || 'org'
  let candidate = base
  let n = 1
  // Local dev / seed scale — a simple loop is fine; revisit only if org creation
  // becomes a hot path at real scale.
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    n += 1
    candidate = `${base}-${n}`
  }
  return candidate
}
