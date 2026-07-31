'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/platform/AppShell'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  before: unknown
  after: unknown
  createdAt: string
  actor: { name: string; email: string } | null
}

// US-61, AC US-61 — owner/admin-only accountability view (AUTH_RBAC.md §2
// "Audit log — view"). Surfaces every mutating action taken on this org's
// data, including actions a Yorkstn Staff member took on the org's behalf
// (AUTH_RBAC.md §3 — "no privileged, invisible access").
export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/organizations/current/audit-log')
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) {
          setError(body.error?.message ?? 'Could not load the audit log.')
          return
        }
        setEntries(body.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Audit Log</h1>

      {error && <p className="tw-mb-4 tw-text-sm tw-text-red-600">{error}</p>}

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No recorded actions yet.</p>
      ) : (
        <table className="tw-w-full tw-text-left tw-text-sm">
          <thead>
            <tr className="tw-border-b tw-border-gray-200 tw-text-gray-500">
              <th className="tw-py-2">When</th>
              <th className="tw-py-2">Actor</th>
              <th className="tw-py-2">Action</th>
              <th className="tw-py-2">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="tw-border-b tw-border-gray-100 tw-align-top">
                <td className="tw-whitespace-nowrap tw-py-2 tw-text-gray-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="tw-py-2">{entry.actor?.name ?? 'Unknown'}</td>
                <td className="tw-py-2 tw-font-mono tw-text-xs">{entry.action}</td>
                <td className="tw-py-2 tw-text-gray-500">
                  {entry.entityType} <span className="tw-text-xs tw-text-gray-400">{entry.entityId}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  )
}
