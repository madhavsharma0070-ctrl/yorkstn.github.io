'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface City {
  id: string
  name: string
  state: string
}
interface SiteScoreBreakdown {
  footfall: number
  rent: number
  competitiveDensity: number
  distributionMaturity: number
}
interface Site {
  id: string
  name: string
  address: string | null
  status: string
  computedScore: number | null
  scoreBreakdown: SiteScoreBreakdown | null
  city: { id: string; name: string }
  mall: { id: string; name: string } | null
}
interface Weights {
  footfall: number
  rent: number
  competitive_density: number
  distribution_maturity: number
}

const DEFAULT_WEIGHTS: Weights = { footfall: 0.3, rent: 0.3, competitive_density: 0.2, distribution_maturity: 0.2 }

const STATUS_OPTIONS = ['candidate', 'shortlisted', 'rejected', 'selected'] as const
const STATUS_COLORS: Record<string, string> = {
  candidate: 'tw-bg-gray-100 tw-text-gray-600',
  shortlisted: 'tw-bg-blue-100 tw-text-blue-700',
  rejected: 'tw-bg-red-100 tw-text-red-700',
  selected: 'tw-bg-green-100 tw-text-green-700',
}

// US-42 — Site Selection workspace. Scores are computed server-side by a
// pure deterministic function (scoring-engine.ts) and never recomputed
// client-side — this page only submits inputs and renders returned scores.
export default function SiteSelectionPage() {
  const [cities, setCities] = useState<City[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cityId, setCityId] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [footfallScore, setFootfallScore] = useState(50)
  const [rentScore, setRentScore] = useState(50)
  const [competitiveDensityScore, setCompetitiveDensityScore] = useState(50)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const [citiesRes, sitesRes] = await Promise.all([
      fetch('/api/v1/expansion/cities'),
      fetch('/api/v1/expansion/sites'),
    ])
    const citiesBody = await citiesRes.json()
    const sitesBody = await sitesRes.json()
    setCities(citiesBody.data ?? [])
    setSites(sitesBody.data ?? [])
    if (!cityId && citiesBody.data?.length) setCityId(citiesBody.data[0].id)
  }, [cityId])

  useEffect(() => {
    load().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/v1/expansion/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityId,
        name,
        address: address || undefined,
        attributes: { footfallScore, rentScore, competitiveDensityScore },
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not create site.')
      return
    }
    setName('')
    setAddress('')
    await load()
  }

  async function handleStatusChange(siteId: string, status: string) {
    await fetch(`/api/v1/expansion/sites/${siteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function handleSaveWeights() {
    setSubmitting(true)
    await fetch('/api/v1/expansion/site-scoring-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    })
    await load()
    setSubmitting(false)
  }

  return (
    <AppShell>
      <Link href="/app/expansion" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Expansion
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Site Selection</h1>

      <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
        <h2 className="tw-mb-3 tw-font-semibold">Scoring Weights</h2>
        <p className="tw-mb-3 tw-text-xs tw-text-gray-400">
          Changing weights recomputes every site&apos;s score deterministically.
        </p>
        <div className="tw-mb-3 tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-4">
          {(Object.keys(weights) as (keyof Weights)[]).map((key) => (
            <label key={key} className="tw-flex tw-flex-col tw-gap-1 tw-text-xs">
              {key.replace(/_/g, ' ')}
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights[key]}
                onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1"
              />
            </label>
          ))}
        </div>
        <button
          onClick={handleSaveWeights}
          disabled={submitting}
          className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs disabled:tw-opacity-50"
        >
          Save weights & recompute
        </button>
      </div>

      <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
        <h2 className="tw-mb-3 tw-font-semibold">Add a candidate site</h2>
        <form onSubmit={handleCreate} className="tw-flex tw-flex-col tw-gap-3 tw-max-w-xl">
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Site name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          />
          <input
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm"
          />
          <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-text-xs">
            <label className="tw-flex tw-flex-col tw-gap-1">
              Footfall (0-100)
              <input
                type="number"
                min="0"
                max="100"
                value={footfallScore}
                onChange={(e) => setFootfallScore(Number(e.target.value))}
                className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1"
              />
            </label>
            <label className="tw-flex tw-flex-col tw-gap-1">
              Rent (0-100, higher=pricier)
              <input
                type="number"
                min="0"
                max="100"
                value={rentScore}
                onChange={(e) => setRentScore(Number(e.target.value))}
                className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1"
              />
            </label>
            <label className="tw-flex tw-flex-col tw-gap-1">
              Competitive density (0-100)
              <input
                type="number"
                min="0"
                max="100"
                value={competitiveDensityScore}
                onChange={(e) => setCompetitiveDensityScore(Number(e.target.value))}
                className="tw-rounded tw-border tw-border-gray-300 tw-px-2 tw-py-1"
              />
            </label>
          </div>
          {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !cityId}
            className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white disabled:tw-opacity-50"
          >
            Add site
          </button>
        </form>
      </div>

      <h2 className="tw-mb-3 tw-font-semibold">Candidate sites</h2>
      {loading ? (
        <p className="tw-text-sm tw-text-gray-400">Loading…</p>
      ) : sites.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No candidate sites yet.</p>
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-3">
          {sites.map((site) => (
            <div key={site.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
              <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-font-semibold">{site.name}</div>
                  <div className="tw-text-xs tw-text-gray-500">
                    {site.city.name}
                    {site.mall ? ` · ${site.mall.name}` : ''}
                    {site.address ? ` · ${site.address}` : ''}
                  </div>
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-text-right">
                    <div className="tw-text-xl tw-font-semibold">{site.computedScore ?? '—'}</div>
                    <div className="tw-text-xs tw-text-gray-400">score</div>
                  </div>
                  <select
                    value={site.status}
                    onChange={(e) => handleStatusChange(site.id, e.target.value)}
                    className={`tw-rounded tw-border-none tw-px-2 tw-py-1 tw-text-xs ${STATUS_COLORS[site.status] ?? STATUS_COLORS.candidate}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {site.scoreBreakdown && (
                <div className="tw-grid tw-grid-cols-4 tw-gap-3 tw-text-xs tw-text-gray-500">
                  <div>Footfall: {site.scoreBreakdown.footfall}</div>
                  <div>Rent: {site.scoreBreakdown.rent}</div>
                  <div>Competitive density: {site.scoreBreakdown.competitiveDensity}</div>
                  <div>Distribution maturity: {site.scoreBreakdown.distributionMaturity}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
