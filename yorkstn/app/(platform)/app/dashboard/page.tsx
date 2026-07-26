import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { AppShell } from '@/components/platform/AppShell'

// US-46 (Expansion Dashboard) — Milestone 1 ships the empty-state version
// (no fabricated data): real org context, real membership count, and a
// module-by-module "coming in Milestone N" summary rather than placeholder
// numbers. Full aggregation (Readiness Score, open Compliance items, Partner
// status, Roadmap progress) lands in Milestone 7 per MVP_ROADMAP.md.
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

      <div className="tw-grid tw-grid-cols-2 tw-gap-4 md:tw-grid-cols-4">
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">{organization._count.memberships}</div>
          <div className="tw-text-xs tw-text-gray-500">Team members</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">—</div>
          <div className="tw-text-xs tw-text-gray-500">Readiness score (Milestone 5)</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">—</div>
          <div className="tw-text-xs tw-text-gray-500">Open compliance tasks (Milestone 2–3)</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">—</div>
          <div className="tw-text-xs tw-text-gray-500">Partner introductions (Milestone 6)</div>
        </div>
      </div>

      <p className="tw-mt-10 tw-text-sm tw-text-gray-400">
        This is the Milestone 1 empty-state dashboard (docs/phase2/MILESTONES.md). Market
        Intelligence, Compliance, Partner Discovery, and Retail Expansion Intelligence modules
        build out incrementally in later milestones.
      </p>
    </AppShell>
  )
}
