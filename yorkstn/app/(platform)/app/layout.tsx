import type { Metadata } from 'next'
import { SessionProvider } from '@/components/platform/SessionProvider'
import './platform.css'

// A SEPARATE ROOT layout (own <html>/<body>) for the entire /app/** platform
// route group, using Next.js's "parallel root layouts via route groups"
// pattern. This is deliberate, not an accident of nesting: the marketing
// site's root layout (app/(marketing)/layout.tsx) renders its own navbar,
// custom-cursor effects, and cookie banner — none of that should ever wrap
// a platform page. Keeping them as fully separate root layouts (rather than
// nesting the platform under the marketing root) is what makes that
// guarantee structural instead of just a styling convention.
// See DECISIONS.md D-07, D-08, D-23.
export const metadata: Metadata = {
  title: 'Yorkstn Platform',
  description: 'Yorkstn Market Entry Operating System',
}

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <div className="platform-shell">{children}</div>
        </SessionProvider>
      </body>
    </html>
  )
}
