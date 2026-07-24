import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { uniqueOrgSlug } from '@/lib/slug'
import { writeAuditLog } from '@/lib/audit'

const orgSchema = z.object({
  name: z.string().min(1),
  homeCountry: z.string().min(1),
})

// POST /api/v1/onboarding/organization — US-01. Creates the Organization and
// an `owner` Membership for the caller. Also eagerly creates the four 1:1
// "shadow" records every org needs exactly one of (ComplianceCase,
// ExpansionRoadmap, SiteScoringConfig) so every later module can assume they
// exist rather than lazily creating them on first use (a Phase 4 scoping
// call, not specified one way or the other in DATABASE_SCHEMA.md).
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const session = await requireSession()
  const body = orgSchema.parse(await req.json())
  const slug = await uniqueOrgSlug(body.name)

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: body.name, homeCountry: body.homeCountry, slug },
    })
    await tx.membership.create({
      data: { userId: session.user.id, organizationId: org.id, role: 'owner' },
    })
    await tx.complianceCase.create({ data: { organizationId: org.id } })
    await tx.expansionRoadmap.create({ data: { organizationId: org.id } })
    await tx.siteScoringConfig.create({
      data: {
        organizationId: org.id,
        weights: { footfall: 0.3, rent: 0.3, competitive_density: 0.2, distribution_maturity: 0.2 },
      },
    })
    return org
  })

  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: session.user.id,
    action: 'organization.created',
    entityType: 'organization',
    entityId: organization.id,
    after: { name: organization.name, slug: organization.slug },
  })

  return NextResponse.json({ data: organization }, { status: 201 })
})
