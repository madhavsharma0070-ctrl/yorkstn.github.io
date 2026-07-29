'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface RoadmapMilestone {
  id: string
  phase: string
  status: string
}
interface Roadmap {
  id: string
  milestones: RoadmapMilestone[]
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'tw-bg-gray-100 tw-text-gray-500',
  in_progress: 'tw-bg-blue-100 tw-text-blue-700',
  completed: 'tw-bg-green-100 tw-text-green-700',
  blocked: 'tw-bg-red-100 tw-text-red-700',
}

const PHASE_LABELS: Record<string, string> = {
  entity_formation: 'Entity Formation',
  compliance: 'Compliance',
  partner_selection: 'Partner Selection',
  site_selection: 'Site Selection',
  launch: 'Launch',
}

// US-43 — Expansion Roadmap overview. Milestone status is synced from real
// Compliance/Partner/Site/LaunchTask state on every read (milestone-auto-
// sync.ts), never set manually — see docs/phase3/retail-expansion-
// intelligence-engineering-spec.md §4.4.
export default function ExpansionOverviewPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/expansion/roadmap')
      .then((res) => res.json())
      .then((body) => setRoadmap(body.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
        <h1 className="tw-text-2xl tw-font-semibold">Retail Expansion Intelligence</h1>
        <div className="tw-flex tw-gap-2">
          {[
            ['Cities', '/app/expansion/cities'],
            ['Site Selection', '/app/expansion/sites'],
            ['Financial Projections', '/app/expansion/financial-projections'],
            ['Launch Tasks', '/app/expansion/launch-tasks'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-xs hover:tw-bg-gray-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <h2 className="tw-mb-3 tw-font-semibold">Expansion Roadmap</h2>
      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : !roadmap ? (
        <p className="tw-text-sm tw-text-gray-400">No roadmap found for this organization.</p>
      ) : (
        <ol className="tw-flex tw-flex-col tw-gap-2">
          {roadmap.milestones.map((m, i) => (
            <li
              key={m.id}
              className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3"
            >
              <span className="tw-text-sm">
                {i + 1}. {PHASE_LABELS[m.phase] ?? m.phase}
              </span>
              <span className={`tw-rounded tw-px-2 tw-py-0.5 tw-text-xs ${STATUS_COLORS[m.status] ?? STATUS_COLORS.not_started}`}>
                {m.status.replace(/_/g, ' ')}
              </span>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  )
}
