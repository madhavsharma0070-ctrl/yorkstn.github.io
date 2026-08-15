'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface GstItem {
  id: string
  title: string
  status: string
  payload: { state?: string } | null
}

// US-22 — per-state GST registration tracker. Auto-derivation from the
// org's site/warehouse footprint is a documented Milestone 7 dependency
// (see app/api/v1/compliance/gst/states/route.ts) — states are added
// manually here until Retail Expansion Intelligence's `sites` exist.
export default function GstPage() {
  const [items, setItems] = useState<GstItem[]>([])
  const [state, setState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/compliance/gst')
    if (res.ok) {
      const body = await res.json()
      setItems(body.data.items)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/v1/compliance/gst/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not add state.')
      return
    }
    setState('')
    load()
  }

  return (
    <AppShell>
      <Link href="/app/compliance" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Compliance overview
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">GST Registration</h1>

      <form onSubmit={handleAdd} className="tw-mb-6 tw-flex tw-max-w-xl tw-items-end tw-gap-3">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          State
          <input
            required
            placeholder="e.g. Maharashtra"
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </label>
        <button type="submit" className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-white">
          Add state
        </button>
      </form>
      {error && <p className="tw-mb-4 tw-text-sm tw-text-red-600">{error}</p>}

      <ul className="tw-flex tw-max-w-xl tw-flex-col tw-gap-2">
        {items.map((item) => (
          <li key={item.id} className="tw-flex tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
            <span>{item.payload?.state ?? item.title}</span>
            <span className="tw-text-xs tw-text-gray-400">{item.status.replace(/_/g, ' ')}</span>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
