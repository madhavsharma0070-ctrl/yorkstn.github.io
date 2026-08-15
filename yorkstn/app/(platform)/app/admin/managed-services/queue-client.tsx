'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Update {
  id: string
  note: string
  statusAtTime: string
  createdAt: string
}
interface Engagement {
  id: string
  scope: string
  status: string
  assignedStaffUserId: string | null
  organization: { id: string; name: string }
  updates: Update[]
}

const STATUS_OPTIONS = ['requested', 'scoping', 'in_progress', 'delivered', 'cancelled'] as const

// US-51 — Yorkstn Staff Managed Services queue. Platform admins see every
// engagement (and can assign staff); assigned staff see only their own and
// can post status/note updates — both enforced server-side, this client
// just renders whatever the API returns for the caller's role.
export function ManagedServicesQueueClient() {
  const { data: session } = useSession()
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/managed-services/engagements')
    const body = await res.json()
    setEngagements(body.data ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleAssignToMe(engagementId: string) {
    if (!session?.user.id) return
    setError(null)
    const res = await fetch(`/api/v1/admin/managed-services/engagements/${engagementId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffUserId: session.user.id }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not assign engagement.')
      return
    }
    await load()
  }

  async function handlePostUpdate(engagementId: string) {
    const note = noteDrafts[engagementId]
    if (!note?.trim()) return
    setError(null)
    const res = await fetch(`/api/v1/admin/managed-services/engagements/${engagementId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, status: statusDrafts[engagementId] || undefined }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not post update.')
      return
    }
    setNoteDrafts((d) => ({ ...d, [engagementId]: '' }))
    await load()
  }

  return (
    <div className="tw-mx-auto tw-max-w-3xl tw-p-8">
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Managed Services Queue</h1>
      {error && <p className="tw-mb-4 tw-text-sm tw-text-red-600">{error}</p>}

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : engagements.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No engagements to show.</p>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-4">
          {engagements.map((eng) => (
            <div key={eng.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
              <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-sm tw-font-medium">{eng.organization.name}</div>
                  <div className="tw-text-xs tw-text-gray-500">{eng.scope}</div>
                </div>
                <span className="tw-rounded tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-text-xs tw-text-gray-600">
                  {eng.status.replace(/_/g, ' ')}
                </span>
              </div>

              {!eng.assignedStaffUserId && (
                <button
                  onClick={() => handleAssignToMe(eng.id)}
                  className="tw-mb-2 tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs hover:tw-bg-gray-50"
                >
                  Assign to me
                </button>
              )}

              {eng.updates.length > 0 && (
                <ul className="tw-mb-2 tw-flex tw-flex-col tw-gap-1 tw-border-t tw-border-gray-100 tw-pt-2 tw-text-xs tw-text-gray-500">
                  {eng.updates.map((u) => (
                    <li key={u.id} className="tw-flex tw-justify-between">
                      <span>{u.note}</span>
                      <span className="tw-text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="tw-flex tw-items-center tw-gap-2">
                <select
                  value={statusDrafts[eng.id] ?? ''}
                  onChange={(e) => setStatusDrafts((d) => ({ ...d, [eng.id]: e.target.value }))}
                  className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1 tw-text-xs"
                >
                  <option value="">Keep status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Add a note for the brand"
                  value={noteDrafts[eng.id] ?? ''}
                  onChange={(e) => setNoteDrafts((d) => ({ ...d, [eng.id]: e.target.value }))}
                  className="tw-flex-1 tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1 tw-text-xs"
                />
                <button
                  onClick={() => handlePostUpdate(eng.id)}
                  className="tw-rounded tw-bg-gray-900 tw-px-3 tw-py-1 tw-text-xs tw-text-white"
                >
                  Post update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
