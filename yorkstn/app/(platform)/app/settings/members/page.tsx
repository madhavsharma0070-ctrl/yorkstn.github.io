'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/platform/AppShell'

interface Member {
  membershipId: string
  userId: string
  name: string
  email: string
  role: string
  status: string
}

const ROLES = ['owner', 'admin', 'compliance_manager', 'analyst_editor', 'viewer'] as const

// US-02, US-60 — member list + invite form. RBAC is enforced server-side
// (members:manage, AUTH_RBAC.md §2); a member without permission simply gets
// a 403 from the invite API, surfaced as an inline error rather than a
// silently-broken form.
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('viewer')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/v1/organizations/current/members')
    if (res.ok) {
      const body = await res.json()
      setMembers(body.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInviteLink(null)

    const res = await fetch('/api/v1/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const body = await res.json()

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not send invitation.')
      return
    }

    setInviteLink(`${window.location.origin}/app/invite/${body.data.token}`)
    setInviteEmail('')
  }

  return (
    <AppShell>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Members</h1>

      <form onSubmit={handleInvite} className="tw-mb-8 tw-flex tw-flex-wrap tw-items-end tw-gap-3">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Email
          <input
            required
            type="email"
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </label>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Role
          <select
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-white">
          Send invite
        </button>
      </form>

      {error && <p className="tw-mb-4 tw-text-sm tw-text-red-600">{error}</p>}
      {inviteLink && (
        <p className="tw-mb-4 tw-break-all tw-rounded tw-bg-gray-50 tw-p-3 tw-text-sm">
          Invitation created. Since email delivery isn&apos;t wired up yet (see TODO.md), share this
          link directly: <span className="tw-font-mono">{inviteLink}</span>
        </p>
      )}

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : (
        <table className="tw-w-full tw-text-left tw-text-sm">
          <thead>
            <tr className="tw-border-b tw-border-gray-200 tw-text-gray-500">
              <th className="tw-py-2">Name</th>
              <th className="tw-py-2">Email</th>
              <th className="tw-py-2">Role</th>
              <th className="tw-py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.membershipId} className="tw-border-b tw-border-gray-100">
                <td className="tw-py-2">{m.name}</td>
                <td className="tw-py-2">{m.email}</td>
                <td className="tw-py-2">{m.role.replace(/_/g, ' ')}</td>
                <td className="tw-py-2">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  )
}
