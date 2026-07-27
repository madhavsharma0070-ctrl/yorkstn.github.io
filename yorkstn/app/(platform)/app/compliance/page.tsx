'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface WorkflowItem {
  id: string
  workflowType: string
  title: string
  status: string
  dueAt: string | null
  contentSourceUrl: string | null
  isStale: boolean
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'tw-bg-gray-100 tw-text-gray-700',
  in_progress: 'tw-bg-blue-100 tw-text-blue-700',
  blocked: 'tw-bg-red-100 tw-text-red-700',
  completed: 'tw-bg-green-100 tw-text-green-700',
  not_applicable: 'tw-bg-gray-100 tw-text-gray-400',
}

// US-26/27 — cross-workflow timeline (Milestone 3 will add Import/GST/BIS/
// Trademark content; Milestone 2 populates entity_formation items only).
export default function ComplianceOverviewPage() {
  const [items, setItems] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/compliance/overview')
      .then((res) => res.json())
      .then((body) => setItems(body.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
        <h1 className="tw-text-2xl tw-font-semibold">Compliance</h1>
        <Link
          href="/app/compliance/entity-formation"
          className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white"
        >
          Entity Formation workflow
        </Link>
      </div>

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">
          No compliance workflow items yet. Start with the Entity Formation workflow above.
        </p>
      ) : (
        <table className="tw-w-full tw-text-left tw-text-sm">
          <thead>
            <tr className="tw-border-b tw-border-gray-200 tw-text-gray-500">
              <th className="tw-py-2">Workflow</th>
              <th className="tw-py-2">Task</th>
              <th className="tw-py-2">Status</th>
              <th className="tw-py-2">Due</th>
              <th className="tw-py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="tw-border-b tw-border-gray-100">
                <td className="tw-py-2 tw-text-gray-500">{item.workflowType.replace(/_/g, ' ')}</td>
                <td className="tw-py-2">{item.title}</td>
                <td className="tw-py-2">
                  <span className={`tw-rounded tw-px-2 tw-py-1 tw-text-xs ${STATUS_COLORS[item.status]}`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="tw-py-2 tw-text-gray-500">
                  {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : '—'}
                </td>
                <td className="tw-py-2">
                  {item.contentSourceUrl && (
                    <a
                      href={item.contentSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`tw-text-xs tw-underline ${item.isStale ? 'tw-text-amber-600' : 'tw-text-gray-400'}`}
                    >
                      {item.isStale ? 'source (needs re-verification)' : 'source'}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  )
}
