'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface Mall {
  id: string
  name: string
  footfallProxyIndicator: string | null
}
interface CityDetail {
  id: string
  name: string
  state: string
  tier: string | null
  population: number | null
  demographics: Record<string, unknown> | null
  realEstateCostBenchmark: Record<string, unknown> | null
  distributionMaturity: Record<string, string> | null
  lastVerifiedAt: string | null
  sourceUrl: string | null
  malls: Mall[]
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm sm:tw-grid-cols-3">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <div className="tw-text-xs tw-text-gray-400">{key.replace(/_/g, ' ')}</div>
          <div>{String(value)}</div>
        </div>
      ))}
    </div>
  )
}

// US-40 — City Intelligence detail page.
export default function CityDetailPage({ params }: { params: { cityId: string } }) {
  const [city, setCity] = useState<CityDetail | null>(null)

  useEffect(() => {
    fetch(`/api/v1/expansion/cities/${params.cityId}`)
      .then((res) => res.json())
      .then((body) => setCity(body.data))
  }, [params.cityId])

  if (!city) return null

  return (
    <AppShell>
      <Link href="/app/expansion/cities" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Cities
      </Link>

      <h1 className="tw-mb-1 tw-text-2xl tw-font-semibold">{city.name}</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        {city.state}
        {city.tier ? ` · ${city.tier}` : ''}
        {city.population ? ` · ${city.population.toLocaleString('en-IN')} population` : ''}
      </p>

      {city.distributionMaturity && (
        <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <h2 className="tw-mb-2 tw-font-semibold">Distribution Maturity</h2>
          <KeyValueGrid data={city.distributionMaturity} />
        </div>
      )}

      {city.realEstateCostBenchmark && (
        <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <h2 className="tw-mb-2 tw-font-semibold">Real Estate Cost Benchmark</h2>
          <KeyValueGrid data={city.realEstateCostBenchmark} />
        </div>
      )}

      {city.demographics && (
        <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <h2 className="tw-mb-2 tw-font-semibold">Demographics</h2>
          <KeyValueGrid data={city.demographics} />
        </div>
      )}

      <h2 className="tw-mb-3 tw-font-semibold">Malls</h2>
      {city.malls.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No malls catalogued for this city yet.</p>
      ) : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
          {city.malls.map((mall) => (
            <Link
              key={mall.id}
              href={`/app/expansion/malls/${mall.id}`}
              className="tw-rounded tw-border tw-border-gray-200 tw-p-4 hover:tw-bg-gray-50"
            >
              <div className="tw-font-semibold">{mall.name}</div>
              {mall.footfallProxyIndicator && (
                <div className="tw-text-xs tw-text-gray-500">Footfall: {mall.footfallProxyIndicator}</div>
              )}
            </Link>
          ))}
        </div>
      )}

      {(city.lastVerifiedAt || city.sourceUrl) && (
        <p className="tw-mt-8 tw-text-xs tw-text-gray-400">
          {city.lastVerifiedAt && `Last verified ${new Date(city.lastVerifiedAt).toLocaleDateString()}`}
          {city.sourceUrl && (
            <>
              {' · '}
              <a href={city.sourceUrl} target="_blank" rel="noreferrer" className="tw-underline">
                Source
              </a>
            </>
          )}
        </p>
      )}
    </AppShell>
  )
}
