'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface PartnerProfile {
  id: string
  businessName: string
  category: string
  description: string | null
  verificationStatus: string
  cities: { id: string; name: string; state: string }[]
  references: { referenceName: string; note: string | null }[]
}

// US-31/33.
export default function PartnerDetailPage({ params }: { params: { id: string } }) {
  const [partner, setPartner] = useState<PartnerProfile | null>(null)
  const [context, setContext] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/partners/${params.id}`)
      .then((res) => res.json())
      .then((body) => setPartner(body.data))
  }, [params.id])

  async function handleIntroduce(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`/api/v1/partners/${params.id}/introduction-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not send introduction request.')
      return
    }
    setSent(true)
  }

  if (!partner) return null

  return (
    <AppShell>
      <Link href="/app/partners" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Partners
      </Link>

      <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2">
        <h1 className="tw-text-2xl tw-font-semibold">{partner.businessName}</h1>
        {partner.verificationStatus !== 'verified' && (
          <span className="tw-rounded tw-bg-amber-100 tw-px-2 tw-py-0.5 tw-text-xs tw-text-amber-700">
            {partner.verificationStatus}
          </span>
        )}
      </div>
      <p className="tw-mb-4 tw-text-sm tw-text-gray-500">{partner.category.replace(/_/g, ' ')}</p>
      {partner.description && <p className="tw-mb-4 tw-max-w-xl tw-text-sm">{partner.description}</p>}

      {partner.cities.length > 0 && (
        <p className="tw-mb-4 tw-text-sm tw-text-gray-500">
          Serves: {partner.cities.map((c) => c.name).join(', ')}
        </p>
      )}

      <div className="tw-max-w-xl">
        <h2 className="tw-mb-2 tw-font-semibold">Request an introduction</h2>
        {sent ? (
          <p className="tw-text-sm tw-text-green-700">Introduction request sent.</p>
        ) : (
          <form onSubmit={handleIntroduce} className="tw-flex tw-flex-col tw-gap-3">
            <textarea
              className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
              placeholder="Add context for this introduction (optional)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
            {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
            <button type="submit" className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white">
              Send introduction request
            </button>
          </form>
        )}
      </div>
    </AppShell>
  )
}
