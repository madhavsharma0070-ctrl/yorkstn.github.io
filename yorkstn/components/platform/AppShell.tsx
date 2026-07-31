import Link from 'next/link'
import { OrgSwitcher } from '@/components/platform/OrgSwitcher'
import { SignOutButton } from '@/components/platform/SignOutButton'

// Persistent sidebar nav per docs/phase2/INFORMATION_ARCHITECTURE.md §2.
// Module content pages (Market Intelligence, Compliance, Partners, Expansion)
// land in later milestones (docs/phase2/MVP_ROADMAP.md) — this shell exists
// now so Milestone 1's dashboard has real navigation, not a dead-end page.
const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/market-intelligence', label: 'Market Intelligence' },
  { href: '/app/compliance', label: 'Compliance' },
  { href: '/app/partners', label: 'Partners' },
  { href: '/app/expansion', label: 'Expansion' },
  { href: '/app/managed-services', label: 'Managed Services' },
] as const

export function AppShell({
  orgName,
  children,
}: {
  orgName?: string
  children: React.ReactNode
}) {
  return (
    <div className="tw-flex tw-min-h-screen">
      <aside className="tw-w-64 tw-shrink-0 tw-border-r tw-border-gray-200 tw-bg-white tw-p-4">
        <div className="tw-mb-6 tw-text-lg tw-font-semibold">Yorkstn</div>
        <OrgSwitcher />
        {orgName && <div className="tw-mb-4 tw-text-xs tw-text-gray-400">{orgName}</div>}
        <nav className="tw-flex tw-flex-col tw-gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700 hover:tw-bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="tw-mt-8 tw-border-t tw-border-gray-200 tw-pt-4">
          <Link
            href="/app/settings/members"
            className="tw-block tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-500 hover:tw-bg-gray-100"
          >
            Settings
          </Link>
          <Link
            href="/app/settings/audit-log"
            className="tw-block tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-500 hover:tw-bg-gray-100"
          >
            Audit Log
          </Link>
          <SignOutButton />
        </div>
      </aside>
      <main className="tw-flex-1 tw-p-8">{children}</main>
    </div>
  )
}
