'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

const STAGES = ['search', 'filing', 'examination', 'publication', 'opposition_window', 'registered']

interface TrademarkItem {
  id: string
  title: string
  status: string
  payload: { markName?: string; stage?: string } | null
}

// US-24 — Trademark/IP status-stage tracker.
export default function TrademarkPage() {
  const [items, setItems] = useState<TrademarkItem[]>([])
  const [markName, setMarkName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/compliance/trademark_ip')
    if (res.ok) {
      const body = await res.json()
      setItems(body.data.items)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/v1/compliance/trademark/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markName }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not start trademark tracking.')
      return
    }
    setMarkName('')
    load()
  }

  async function advanceStage(item: TrademarkItem) {
    const currentIdx = STAGES.indexOf(item.payload?.stage ?? 'search')
    const next = STAGES[currentIdx + 1]
    if (!next) return

    await fetch(`/api/v1/compliance/workflow-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { ...item.payload, stage: next },
        status: next === 'registered' ? 'completed' : 'in_progress',
      }),
    })
    load()
  }

  return (
    <AppShell>
      <Link href="/app/compliance" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Compliance overview
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Trademark / IP</h1>

      <form onSubmit={handleStart} className="tw-mb-6 tw-flex tw-max-w-xl tw-items-end tw-gap-3">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Mark name
          <input
            required
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={markName}
            onChange={(e) => setMarkName(e.target.value)}
          />
        </label>
        <button type="submit" className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-white">
          Start tracking
        </button>
      </form>
      {error && <p className="tw-mb-4 tw-text-sm tw-text-red-600">{error}</p>}

      <ul className="tw-flex tw-max-w-xl tw-flex-col tw-gap-3">
        {items.map((item) => {
          const stage = item.payload?.stage ?? 'search'
          return (
            <li key={item.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
              <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                <span>{item.title}</span>
                <span className="tw-text-xs tw-uppercase tw-text-gray-400">{stage.replace(/_/g, ' ')}</span>
              </div>
              {stage !== 'registered' && (
                <button
                  onClick={() => advanceStage(item)}
                  className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs"
                >
                  Advance to next stage
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </AppShell>
  )
}
