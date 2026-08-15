import type { Metadata } from 'next'
import { SessionProvider } from '@/components/platform/SessionProvider'
import '../app/platform.css'

// A separate root layout for the Partner portal (AUTH_RBAC.md §4) — a
// distinct user type (`partner`) with its own, much narrower surface, never
// sharing a page with either the marketing site or the brand-side /app
// platform (DECISIONS.md D-23's "parallel root layouts" pattern extended to
// a third independent subtree).
export const metadata: Metadata = {
  title: 'Yorkstn Partner Portal',
}

export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <div className="platform-shell">
            <nav className="tw-border-b tw-border-gray-200 tw-p-4 tw-text-sm">
              <span className="tw-font-semibold">Yorkstn Partner Portal</span>
            </nav>
            <div className="tw-p-8">{children}</div>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
