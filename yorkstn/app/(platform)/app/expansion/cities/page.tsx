'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface City {
  id: string
  name: string
  state: string
  tier: string | null
  population: number | null
}

// US-40 — City Intelligence directory. Reference/content data, not
// org-scoped (DECISIONS.md D-14): every authenticated org sees the same
// curated list of cities.
export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/expansion/cities')
      .then((res) => res.json())
      .then((body) => setCities(body.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <Link href="/app/expansion" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Expansion
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Cities</h1>

      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : cities.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No cities available yet.</p>
      ) : (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 lg:tw-grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/app/expansion/cities/${city.id}`}
              className="tw-rounded tw-border tw-border-gray-200 tw-p-4 hover:tw-bg-gray-50"
            >
              <div className="tw-font-semibold">{city.name}</div>
              <div className="tw-text-xs tw-text-gray-500">{city.state}</div>
              <div className="tw-mt-2 tw-flex tw-gap-2 tw-text-xs tw-text-gray-400">
                {city.tier && <span>{city.tier}</span>}
                {city.population && <span>{city.population.toLocaleString('en-IN')} population</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  )
}
