'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface BisItem {
  id: string
  title: string
}

// US-23 — BIS/QCO certification tracker, shares the HSN lookup with Import.
export default function BisPage() {
  const [productName, setProductName] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [items, setItems] = useState<BisItem[] | null>(null)
  const [requiresBis, setRequiresBis] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/v1/compliance/bis/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, hsnCode }),
    })
    const body = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not check BIS applicability.')
      return
    }

    setItems(body.data.items)
    setRequiresBis(body.data.lookup.requiresBis)
  }

  return (
    <AppShell>
      <Link href="/app/compliance" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Compliance overview
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">BIS Certification</h1>

      <form onSubmit={handleSubmit} className="tw-mb-6 tw-flex tw-max-w-xl tw-flex-col tw-gap-4">
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
          {submitting ? 'Checking…' : 'Check BIS applicability'}
        </button>
      </form>

      {items && (
        <div className="tw-max-w-xl">
          {!requiresBis ? (
            <p className="tw-text-sm tw-text-gray-500">
              This product's HSN chapter is not flagged as BIS-covered in our curated table. Always
              re-verify directly with BIS for your specific product before import.
            </p>
          ) : (
            <ul className="tw-flex tw-flex-col tw-gap-2">
              {items.map((item) => (
                <li key={item.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
                  {item.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  )
}
