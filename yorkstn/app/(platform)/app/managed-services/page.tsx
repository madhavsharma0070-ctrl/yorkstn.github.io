'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/platform/AppShell'

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
  linkedComplianceItemId: string | null
  deliverableUrl: string | null
  createdAt: string
  assignedStaffUser: { id: string; name: string } | null
  updates: Update[]
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'tw-bg-gray-100 tw-text-gray-600',
  scoping: 'tw-bg-blue-100 tw-text-blue-700',
  in_progress: 'tw-bg-blue-100 tw-text-blue-700',
  delivered: 'tw-bg-green-100 tw-text-green-700',
  cancelled: 'tw-bg-red-100 tw-text-red-700',
}

// US-50/51 — Managed Services. Requests are made in-platform (optionally
// triggered from a Compliance workflow item's "Get expert help" link) and
// tracked here with the full update history, never an off-platform channel.
export default function ManagedServicesPage() {
  return (
    <Suspense fallback={null}>
      <ManagedServicesPageContent />
    </Suspense>
  )
}

function ManagedServicesPageContent() {
  const searchParams = useSearchParams()
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const workflowItemId = searchParams.get('workflowItemId') ?? undefined
  const workflowTitle = searchParams.get('workflowTitle')

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/managed-services/engagements')
    const body = await res.json()
    setEngagements(body.data ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (workflowTitle) setScope(`Help with: ${workflowTitle}`)
  }, [workflowTitle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/v1/managed-services/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, linkedComplianceItemId: workflowItemId }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not submit request.')
      return
    }
    setScope('')
    await load()
  }

  return (
    <AppShell>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Managed Services</h1>

      <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
        <h2 className="tw-mb-3 tw-font-semibold">Request an engagement</h2>
        <form onSubmit={handleSubmit} className="tw-flex tw-max-w-xl tw-flex-col tw-gap-3">
          {workflowTitle && (
            <p className="tw-text-xs tw-text-gray-400">Linked to Compliance task: {workflowTitle}</p>
          )}
          <textarea
            required
            placeholder="Describe what you need expert help with"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          />
          {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="tw-w-fit tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white disabled:tw-opacity-50"
          >
            Request engagement
          </button>
        </form>
      </div>

      <h2 className="tw-mb-3 tw-font-semibold">Your engagements</h2>
      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : engagements.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No managed-services engagements yet.</p>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-3">
          {engagements.map((eng) => (
            <div key={eng.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
              <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-sm tw-font-medium">{eng.scope}</div>
                  <div className="tw-text-xs tw-text-gray-400">
                    {new Date(eng.createdAt).toLocaleDateString()}
                    {eng.assignedStaffUser && ` · Assigned to ${eng.assignedStaffUser.name}`}
                  </div>
                </div>
                <span className={`tw-rounded tw-px-2 tw-py-0.5 tw-text-xs ${STATUS_COLORS[eng.status] ?? STATUS_COLORS.requested}`}>
                  {eng.status.replace(/_/g, ' ')}
                </span>
              </div>
              {eng.deliverableUrl && (
                <a
                  href={eng.deliverableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tw-mb-2 tw-inline-block tw-text-xs tw-text-blue-600 tw-underline"
                >
                  View deliverable
                </a>
              )}
              {eng.updates.length > 0 && (
                <ul className="tw-mt-2 tw-flex tw-flex-col tw-gap-1 tw-border-t tw-border-gray-100 tw-pt-2 tw-text-xs">
                  {eng.updates.map((u) => (
                    <li key={u.id} className="tw-flex tw-justify-between tw-text-gray-500">
                      <span>{u.note}</span>
                      <span className="tw-text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
