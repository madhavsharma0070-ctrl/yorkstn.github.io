'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface LineItem {
  id: string
  label: string
  amount: number
  sourceType: string
}
interface Projection {
  id: string
  horizonMonths: number
  createdAt: string
  userAssumptions: { label: string; amount: number }[]
  platformBenchmarks: { label: string; amount: number }[]
  lineItems: LineItem[]
}

interface DraftLineItem {
  label: string
  amount: string
  sourceType: 'user_input' | 'platform_benchmark'
}

const EMPTY_LINE_ITEM: DraftLineItem = { label: '', amount: '', sourceType: 'user_input' }

// US-44, AC US-44 — Financial Projections workspace. userAssumptions and
// platformBenchmarks are always rendered as two structurally separate
// lists, never blended into one number (docs/phase3/retail-expansion-
// intelligence-engineering-spec.md §5) — this is the UI expression of
// DECISIONS.md's non-goal against presenting speculative financials as fact.
export default function FinancialProjectionsPage() {
  const [projections, setProjections] = useState<Projection[]>([])
  const [loading, setLoading] = useState(true)
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([{ ...EMPTY_LINE_ITEM }])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/expansion/financial-projections')
    const body = await res.json()
    setProjections(body.data ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  function updateLineItem(index: number, patch: Partial<DraftLineItem>) {
    setLineItems((items) => items.map((li, i) => (i === index ? { ...li, ...patch } : li)))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...EMPTY_LINE_ITEM }])
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const validItems = lineItems.filter((li) => li.label.trim() && li.amount !== '')
    if (validItems.length === 0) {
      setError('Add at least one line item.')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/v1/expansion/financial-projections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        horizonMonths,
        lineItems: validItems.map((li) => ({ label: li.label, amount: Number(li.amount), sourceType: li.sourceType })),
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not create projection.')
      return
    }
    setLineItems([{ ...EMPTY_LINE_ITEM }])
    await load()
  }

  return (
    <AppShell>
      <Link href="/app/expansion" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Expansion
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Financial Projections</h1>

      <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
        <h2 className="tw-mb-3 tw-font-semibold">New projection</h2>
        <form onSubmit={handleSubmit} className="tw-flex tw-max-w-2xl tw-flex-col tw-gap-3">
          <label className="tw-flex tw-flex-col tw-gap-1 tw-text-xs">
            Horizon (months)
            <input
              type="number"
              min="1"
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(Number(e.target.value))}
              className="tw-w-32 tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1"
            />
          </label>

          {lineItems.map((li, i) => (
            <div key={i} className="tw-flex tw-items-center tw-gap-2">
              <input
                placeholder="Line item label"
                value={li.label}
                onChange={(e) => updateLineItem(i, { label: e.target.value })}
                className="tw-flex-1 tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
              />
              <input
                type="number"
                placeholder="Amount (INR)"
                value={li.amount}
                onChange={(e) => updateLineItem(i, { amount: e.target.value })}
                className="tw-w-36 tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
              />
              <select
                value={li.sourceType}
                onChange={(e) => updateLineItem(i, { sourceType: e.target.value as DraftLineItem['sourceType'] })}
                className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-2 tw-text-xs"
              >
                <option value="user_input">My assumption</option>
                <option value="platform_benchmark">Platform benchmark</option>
              </select>
              <button
                type="button"
                onClick={() => removeLineItem(i)}
                className="tw-text-xs tw-text-gray-400 hover:tw-text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLineItem}
            className="tw-w-fit tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs"
          >
            + Add line item
          </button>

          {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="tw-w-fit tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white disabled:tw-opacity-50"
          >
            Create projection
          </button>
        </form>
      </div>

      <h2 className="tw-mb-3 tw-font-semibold">Saved projections</h2>
      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : projections.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No projections yet.</p>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-4">
          {projections.map((p) => (
            <div key={p.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
              <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
                <span className="tw-text-sm tw-font-semibold">{p.horizonMonths}-month horizon</span>
                <span className="tw-text-xs tw-text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2">
                <div>
                  <div className="tw-mb-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">
                    Your assumptions
                  </div>
                  {p.userAssumptions.length === 0 ? (
                    <p className="tw-text-xs tw-text-gray-400">None.</p>
                  ) : (
                    <ul className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
                      {p.userAssumptions.map((li, i) => (
                        <li key={i} className="tw-flex tw-justify-between">
                          <span>{li.label}</span>
                          <span>₹{li.amount.toLocaleString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="tw-mb-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">
                    Platform benchmarks
                  </div>
                  {p.platformBenchmarks.length === 0 ? (
                    <p className="tw-text-xs tw-text-gray-400">None.</p>
                  ) : (
                    <ul className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
                      {p.platformBenchmarks.map((li, i) => (
                        <li key={i} className="tw-flex tw-justify-between">
                          <span>{li.label}</span>
                          <span>₹{li.amount.toLocaleString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
