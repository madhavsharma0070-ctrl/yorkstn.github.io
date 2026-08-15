import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AppShell } from '@/components/platform/AppShell'
import { DashboardSummary } from '@/components/platform/DashboardSummary'

// US-46 — Expansion Dashboard. Real org context plus the composed
// cross-module summary (Readiness Score, open Compliance items, Partner
// introduction counts, Roadmap progress) from /api/v1/dashboard
// (dashboard-aggregation.service.ts).
export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/app/login')
  if (!session.user.activeOrganizationId) redirect('/app/onboarding')

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.activeOrganizationId },
    include: {
      brandProfile: true,
      _count: { select: { memberships: true } },
    },
  })

  if (!organization) redirect('/app/onboarding')

  return (
    <AppShell orgName={organization.name}>
      <h1 className="tw-mb-1 tw-text-2xl tw-font-semibold">{organization.name}</h1>
      <p className="tw-mb-8 tw-text-sm tw-text-gray-500">
        {organization.brandProfile
          ? `${organization.brandProfile.category.replace(/_/g, ' ')} · ${organization.brandProfile.priceTier} · ${organization.homeCountry}`
          : 'Brand profile not yet completed.'}
      </p>

      <DashboardSummary teamMemberCount={organization._count.memberships} />
    </AppShell>
  )
}
