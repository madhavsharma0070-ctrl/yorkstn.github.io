'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface Partner {
  id: string
  businessName: string
  category: string
  verificationStatus: string
}

interface PartnerMatch {
  partnerId: string
  businessName: string
  category: string
  matchScore: number
}

const CATEGORIES = [
  'manufacturer',
  'franchise',
  'retail_distributor',
  'mall_operator',
  'cre',
  'logistics',
  'warehousing',
  'marketing_agency',
  'legal',
]

// US-30/32 — Partner directory search + AI recommendations panel.
export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [category, setCategory] = useState('')
  const [recommendations, setRecommendations] = useState<PartnerMatch[] | null>(null)
  const [loadingRecs, setLoadingRecs] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    const res = await fetch(`/api/v1/partners?${params.toString()}`)
    if (res.ok) {
      const body = await res.json()
      setPartners(body.data)
    }
  }, [category])

  useEffect(() => {
    load()
  }, [load])

  async function handleGenerateRecommendations() {
    setLoadingRecs(true)
    await fetch('/api/v1/market-intelligence/partner-recommendations', { method: 'POST' })
    const res = await fetch('/api/v1/market-intelligence/partner-recommendations')
    if (res.ok) {
      const body = await res.json()
      setRecommendations(body.data?.structuredOutput?.matches ?? [])
    }
    setLoadingRecs(false)
  }

  return (
    <AppShell>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Partners</h1>

      <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
        <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
          <h2 className="tw-font-semibold">AI Partner Recommendations</h2>
          <button
            onClick={handleGenerateRecommendations}
            disabled={loadingRecs}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs disabled:tw-opacity-50"
          >
            {loadingRecs ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {recommendations && (
          <ul className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
            {recommendations.map((m) => (
              <li key={m.partnerId} className="tw-flex tw-justify-between">
                <Link href={`/app/partners/${m.partnerId}`} className="tw-underline">
                  {m.businessName}
                </Link>
                <span className="tw-text-gray-400">
                  {m.category.replace(/_/g, ' ')} · match {m.matchScore}/100
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tw-mb-4">
        <select
          className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <ul className="tw-flex tw-flex-col tw-gap-2">
        {partners.map((p) => (
          <li key={p.id} className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
            <Link href={`/app/partners/${p.id}`} className="tw-underline">
              {p.businessName}
            </Link>
            <span className="tw-text-gray-400">{p.category.replace(/_/g, ' ')}</span>
          </li>
        ))}
        {partners.length === 0 && <p className="tw-text-sm tw-text-gray-400">No verified partners match this filter.</p>}
      </ul>
    </AppShell>
  )
}
