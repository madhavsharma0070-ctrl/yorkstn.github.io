'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface OrgOption {
  organizationId: string
  name: string
  role: string
}

// API_SPECIFICATION.md §0.4 / IA §4's organization switcher. Validates
// server-side via /api/v1/session/active-organization before persisting the
// claim through useSession().update() — see auth.ts's jwt callback.
export function OrgSwitcher() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [orgs, setOrgs] = useState<OrgOption[]>([])

  useEffect(() => {
    fetch('/api/v1/organizations/me')
      .then((res) => res.json())
      .then((body) => setOrgs(body.data ?? []))
  }, [])

  if (orgs.length <= 1) return null

  async function handleSwitch(organizationId: string) {
    const res = await fetch('/api/v1/session/active-organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId }),
    })
    if (!res.ok) return
    await update({ activeOrganizationId: organizationId })
    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <select
      className="tw-mb-4 tw-w-full tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1 tw-text-sm"
      value={session?.user.activeOrganizationId ?? ''}
      onChange={(e) => handleSwitch(e.target.value)}
    >
      {orgs.map((o) => (
        <option key={o.organizationId} value={o.organizationId}>
          {o.name}
        </option>
      ))}
    </select>
  )
}
