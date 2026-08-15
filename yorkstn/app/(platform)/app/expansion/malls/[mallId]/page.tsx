'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface MallDetail {
  id: string
  name: string
  footfallProxyIndicator: string | null
  tenantMix: Record<string, unknown> | null
  leaseBenchmark: Record<string, unknown> | null
  lastVerifiedAt: string | null
  sourceUrl: string | null
  city: { id: string; name: string; state: string }
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

// US-41 — Mall Intelligence detail page.
export default function MallDetailPage({ params }: { params: { mallId: string } }) {
  const [mall, setMall] = useState<MallDetail | null>(null)

  useEffect(() => {
    fetch(`/api/v1/expansion/malls/${params.mallId}`)
      .then((res) => res.json())
      .then((body) => setMall(body.data))
  }, [params.mallId])

  if (!mall) return null

  return (
    <AppShell>
      <Link
        href={`/app/expansion/cities/${mall.city.id}`}
        className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline"
      >
        ← {mall.city.name}
      </Link>

      <h1 className="tw-mb-1 tw-text-2xl tw-font-semibold">{mall.name}</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        {mall.city.name}, {mall.city.state}
        {mall.footfallProxyIndicator ? ` · Footfall: ${mall.footfallProxyIndicator}` : ''}
      </p>

      {mall.tenantMix && (
        <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <h2 className="tw-mb-2 tw-font-semibold">Tenant Mix</h2>
          <KeyValueGrid data={mall.tenantMix} />
        </div>
      )}

      {mall.leaseBenchmark && (
        <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
          <h2 className="tw-mb-2 tw-font-semibold">Lease Benchmark</h2>
          <KeyValueGrid data={mall.leaseBenchmark} />
        </div>
      )}

      {(mall.lastVerifiedAt || mall.sourceUrl) && (
        <p className="tw-mt-8 tw-text-xs tw-text-gray-400">
          {mall.lastVerifiedAt && `Last verified ${new Date(mall.lastVerifiedAt).toLocaleDateString()}`}
          {mall.sourceUrl && (
            <>
              {' · '}
              <a href={mall.sourceUrl} target="_blank" rel="noreferrer" className="tw-underline">
                Source
              </a>
            </>
          )}
        </p>
      )}
    </AppShell>
  )
}
