'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface HsnLookupResult {
  chapter: string
  description: string
  requiresBis: boolean
  bisScheme: string | null
  requiresLegalMetrologyLabel: boolean
  notes: string
}

// US-21 — Import compliance checklist, keyed by product HSN code.
export default function ImportCompliancePage() {
  const [productName, setProductName] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [lookup, setLookup] = useState<HsnLookupResult | null>(null)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setCreated(false)

    const res = await fetch('/api/v1/compliance/import/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, hsnCode }),
    })
    const body = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not generate a checklist.')
      return
    }

    setLookup(body.data.lookup)
    setCreated(true)
  }

  return (
    <AppShell>
      <Link href="/app/compliance" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Compliance overview
      </Link>
      <h1 className="tw-mb-2 tw-text-2xl tw-font-semibold">Import Compliance</h1>
      <p className="tw-mb-6 tw-max-w-xl tw-text-sm tw-text-gray-500">
        Enter a product and its HSN code to generate an IEC/DGFT/CBIC/labelling checklist. This is a
        curated seed lookup covering a representative set of HS chapters, not an exhaustive database
        — see <code>lib/modules/compliance/import/hsn-lookup.service.ts</code>.
      </p>

      <form onSubmit={handleLookup} className="tw-mb-8 tw-flex tw-max-w-xl tw-flex-col tw-gap-4">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Product name
          <input
            required
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </label>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          HSN code
          <input
            required
            placeholder="e.g. 610910"
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
          />
        </label>
        {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="tw-mt-2 tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
        >
          {submitting ? 'Generating…' : 'Generate checklist'}
        </button>
      </form>

      {created && lookup && (
        <div className="tw-max-w-xl tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <p className="tw-mb-2 tw-text-sm">
            <strong>HS Chapter {lookup.chapter}</strong> — {lookup.description}
          </p>
          <p className="tw-mb-2 tw-text-sm tw-text-gray-600">{lookup.notes}</p>
          <p className="tw-text-xs tw-text-gray-400">
            BIS required: {lookup.requiresBis ? `Yes (${lookup.bisScheme})` : 'No'} · Legal Metrology
            label required: {lookup.requiresLegalMetrologyLabel ? 'Yes' : 'No'}
          </p>
          <Link href="/app/compliance" className="tw-mt-4 tw-inline-block tw-text-sm tw-underline">
            View created tasks in Compliance overview →
          </Link>
        </div>
      )}
    </AppShell>
  )
}
