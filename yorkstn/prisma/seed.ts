// Seed script for local development and demos — Milestone 1 DoD
// (docs/phase2/MILESTONES.md): 1 demo organization, 5 demo users (one per
// role), reference cities/malls, and a stub partner directory.
//
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'password123' // dev-only seed credential, never used in staging/production

async function hash(password: string) {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('Seeding Yorkstn demo data...')

  // ---- Reference data: cities & malls (illustrative — see research/india-market-entry-regulatory-landscape.md) ----
  const cityData = [
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      tier: 'tier1',
      population: 20_000_000,
      demographics: { note: 'Illustrative seed data, not a licensed feed — see AI_ARCHITECTURE.md Category (d).' },
      distributionMaturity: { generalTrade: 'high', modernTrade: 'high', quickCommerce: 'high' },
      sourceUrl: null,
    },
    {
      name: 'Bengaluru',
      state: 'Karnataka',
      tier: 'tier1',
      population: 13_000_000,
      demographics: { note: 'Illustrative seed data.' },
      distributionMaturity: { generalTrade: 'medium', modernTrade: 'high', quickCommerce: 'high' },
      sourceUrl: null,
    },
    {
      name: 'Delhi',
      state: 'Delhi',
      tier: 'tier1',
      population: 32_000_000,
      demographics: { note: 'Illustrative seed data.' },
      distributionMaturity: { generalTrade: 'high', modernTrade: 'high', quickCommerce: 'high' },
      sourceUrl: null,
    },
    {
      name: 'Pune',
      state: 'Maharashtra',
      tier: 'tier2',
      population: 7_000_000,
      demographics: { note: 'Illustrative seed data.' },
      distributionMaturity: { generalTrade: 'medium', modernTrade: 'medium', quickCommerce: 'medium' },
      sourceUrl: null,
    },
  ]

  const cities = []
  for (const c of cityData) {
    cities.push(
      await prisma.city.upsert({
        where: { name_state: { name: c.name, state: c.state } },
        create: c,
        update: c,
      }),
    )
  }

  await prisma.mall.upsert({
    where: { id: 'seed-mall-mumbai-phoenix' },
    create: {
      id: 'seed-mall-mumbai-phoenix',
      cityId: cities[0].id,
      name: 'Phoenix Palladium (seed example)',
      tenantMix: { anchor: 'department store', mix: 'premium fashion, F&B' },
      leaseBenchmark: { note: 'MG + revenue-share convention — see research/india-market-entry-regulatory-landscape.md §12', mgRentRange: null },
      footfallProxyIndicator: 'high (directional, not census data)',
    },
    update: {},
  })

  // ---- Demo organization ----
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-kids-apparel' },
    create: {
      name: 'Acme Kids Apparel (Demo)',
      slug: 'acme-kids-apparel',
      homeCountry: 'US',
      subscriptionTier: 'growth',
    },
    update: {},
  })

  await prisma.brandProfile.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      category: 'kids',
      subCategory: 'premium apparel',
      priceTier: 'premium',
      homeMarketPriceRange: { min: 25, max: 90, currency: 'USD' },
    },
    update: {},
  })

  await prisma.complianceCase.upsert({
    where: { organizationId: org.id },
    create: { organizationId: org.id },
    update: {},
  })

  const roadmap = await prisma.expansionRoadmap.upsert({
    where: { organizationId: org.id },
    create: { organizationId: org.id },
    update: {},
  })

  await prisma.siteScoringConfig.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      weights: { footfall: 0.3, rent: 0.3, competitive_density: 0.2, distribution_maturity: 0.2 },
    },
    update: {},
  })

  for (const phase of ['entity_formation', 'compliance', 'partner_selection', 'site_selection', 'launch'] as const) {
    await prisma.roadmapMilestone.upsert({
      where: { id: `seed-milestone-${org.id}-${phase}` },
      create: { id: `seed-milestone-${org.id}-${phase}`, expansionRoadmapId: roadmap.id, phase },
      update: {},
    })
  }

  // ---- Demo users, one per persona/role (docs/phase2/PERSONAS.md) ----
  const passwordHash = await hash(DEMO_PASSWORD)
  const demoUsers = [
    { email: 'priya.owner@demo.yorkstn.com', name: 'Priya Nair', role: 'owner' as const },
    { email: 'admin@demo.yorkstn.com', name: 'Demo Admin', role: 'admin' as const },
    { email: 'arjun.compliance@demo.yorkstn.com', name: 'Arjun Mehta', role: 'compliance_manager' as const },
    { email: 'meera.analyst@demo.yorkstn.com', name: 'Meera Kapoor', role: 'analyst_editor' as const },
    { email: 'viewer@demo.yorkstn.com', name: 'Demo Viewer', role: 'viewer' as const },
  ]

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, passwordHash, userType: 'org_user' },
      update: {},
    })
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      create: { userId: user.id, organizationId: org.id, role: u.role },
      update: { role: u.role },
    })
  }

  // ---- Yorkstn Staff (Ananya) — assigned to the demo org (AUTH_RBAC.md §3).
  // Also the seed's sole platform admin (AUTH_RBAC.md §3's is_platform_admin
  // flag) — without at least one seeded admin, Managed Services engagements
  // could never be assigned to staff in the demo environment at all.
  const staffUser = await prisma.user.upsert({
    where: { email: 'ananya.staff@yorkstn.com' },
    create: {
      email: 'ananya.staff@yorkstn.com',
      name: 'Ananya Sharma',
      passwordHash,
      userType: 'yorkstn_staff',
      isPlatformAdmin: true,
    },
    update: { isPlatformAdmin: true },
  })
  await prisma.staffOrgAssignment.upsert({
    where: { userId_organizationId: { userId: staffUser.id, organizationId: org.id } },
    create: { userId: staffUser.id, organizationId: org.id, scope: 'full' },
    update: {},
  })

  // ---- Stub partner directory (docs/phase2/FEATURE_SPECIFICATIONS.md §Module 3) ----
  const partnerSeed = [
    { businessName: 'Rohan Furnishings Pvt. Ltd.', category: 'manufacturer', verificationStatus: 'verified' },
    { businessName: 'Bharat Retail Distributors', category: 'retail_distributor', verificationStatus: 'verified' },
    { businessName: 'Metro Mall Operators', category: 'mall_operator', verificationStatus: 'pending' },
    { businessName: 'Swift Logistics India', category: 'logistics', verificationStatus: 'verified' },
    { businessName: 'NewEntrant CRE Advisors', category: 'cre', verificationStatus: 'unverified' },
  ] as const

  for (const p of partnerSeed) {
    const partner = await prisma.partner.upsert({
      where: { id: `seed-partner-${p.businessName.replace(/\s+/g, '-').toLowerCase()}` },
      create: {
        id: `seed-partner-${p.businessName.replace(/\s+/g, '-').toLowerCase()}`,
        businessName: p.businessName,
        category: p.category,
        verificationStatus: p.verificationStatus,
        capacityAttributes: {},
      },
      update: {},
    })
    await prisma.partnerCity.upsert({
      where: { partnerId_cityId: { partnerId: partner.id, cityId: cities[0].id } },
      create: { partnerId: partner.id, cityId: cities[0].id },
      update: {},
    })
  }

  // A logged-in partner-portal demo user (Rohan), linked to the manufacturer partner above.
  const rohanPartner = await prisma.partner.findUniqueOrThrow({
    where: { id: 'seed-partner-rohan-furnishings-pvt.-ltd.' },
  })
  await prisma.user.upsert({
    where: { email: 'rohan.partner@demo.yorkstn.com' },
    create: {
      email: 'rohan.partner@demo.yorkstn.com',
      name: 'Rohan Furnishings',
      passwordHash,
      userType: 'partner',
      partnerId: rohanPartner.id,
    },
    update: {},
  })

  console.log('Seed complete.')
  console.log(`Demo org: ${org.name} (${org.slug})`)
  console.log(`All demo users share the password: ${DEMO_PASSWORD}`)
  demoUsers.forEach((u) => console.log(`  - ${u.email} (${u.role})`))
  console.log('  - ananya.staff@yorkstn.com (yorkstn_staff, platform admin)')
  console.log('  - rohan.partner@demo.yorkstn.com (partner)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
