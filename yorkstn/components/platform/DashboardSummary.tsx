'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ComplianceItem {
  id: string
  title: string
  dueAt: string | null
  isStale: boolean
}
interface RoadmapMilestone {
  id: string
  phase: string
  status: string
}
interface DashboardData {
  readinessScore: { score: number } | null
  openComplianceItems: ComplianceItem[]
  introductionRequestCounts: Record<string, number>
  roadmapMilestones: RoadmapMilestone[]
}

const PHASE_LABELS: Record<string, string> = {
  entity_formation: 'Entity Formation',
  compliance: 'Compliance',
  partner_selection: 'Partner Selection',
  site_selection: 'Site Selection',
  launch: 'Launch',
}

// US-46 — the dashboard's composed summary card. Fetches
// /api/v1/dashboard (dashboard-aggregation.service.ts), which reads each
// module's own exported functions — no fabricated numbers, no raw
// cross-module joins here or on the server.
export function DashboardSummary({ teamMemberCount }: { teamMemberCount: number }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/dashboard')
      .then((res) => res.json())
      .then((body) => setData(body.data))
      .finally(() => setLoading(false))
  }, [])

  const introductionsSent = data
    ? Object.values(data.introductionRequestCounts).reduce((a, b) => a + b, 0)
    : 0

  const completedMilestones = data ? data.roadmapMilestones.filter((m) => m.status === 'completed').length : 0

  return (
    <>
      <div className="tw-grid tw-grid-cols-2 tw-gap-4 md:tw-grid-cols-4">
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">{teamMemberCount}</div>
          <div className="tw-text-xs tw-text-gray-500">Team members</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">
            {loading ? '—' : data?.readinessScore ? `${data.readinessScore.score}/100` : '—'}
          </div>
          <div className="tw-text-xs tw-text-gray-500">Expansion Readiness Score</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">{loading ? '—' : data?.openComplianceItems.length ?? 0}</div>
          <div className="tw-text-xs tw-text-gray-500">Open compliance tasks</div>
        </div>
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-text-2xl tw-font-semibold">{loading ? '—' : introductionsSent}</div>
          <div className="tw-text-xs tw-text-gray-500">Partner introductions</div>
        </div>
      </div>

      <div className="tw-mt-8 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-font-semibold">Expansion Roadmap</h2>
            <Link href="/app/expansion" className="tw-text-xs tw-text-gray-400 hover:tw-underline">
              View
            </Link>
          </div>
          {loading ? (
            <p className="tw-text-sm tw-text-gray-400">Loading…</p>
          ) : !data || data.roadmapMilestones.length === 0 ? (
            <p className="tw-text-sm tw-text-gray-400">No roadmap yet.</p>
          ) : (
            <>
              <p className="tw-mb-2 tw-text-xs tw-text-gray-400">
                {completedMilestones} of {data.roadmapMilestones.length} phases complete
              </p>
              <ol className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
                {data.roadmapMilestones.map((m) => (
                  <li key={m.id} className="tw-flex tw-justify-between">
                    <span>{PHASE_LABELS[m.phase] ?? m.phase}</span>
                    <span className="tw-text-gray-400">{m.status.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
            <h2 className="tw-font-semibold">Open Compliance Tasks</h2>
            <Link href="/app/compliance" className="tw-text-xs tw-text-gray-400 hover:tw-underline">
              View
            </Link>
          </div>
          {loading ? (
            <p className="tw-text-sm tw-text-gray-400">Loading…</p>
          ) : !data || data.openComplianceItems.length === 0 ? (
            <p className="tw-text-sm tw-text-gray-400">No open compliance tasks.</p>
          ) : (
            <ul className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              {data.openComplianceItems.map((item) => (
                <li key={item.id} className="tw-flex tw-justify-between">
                  <span>
                    {item.title}
                    {item.isStale && <span className="tw-ml-1 tw-text-xs tw-text-amber-600">(stale)</span>}
                  </span>
                  <span className="tw-text-gray-400">
                    {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
