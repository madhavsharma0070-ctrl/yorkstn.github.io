'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/platform/AppShell'

interface AiSource {
  title: string
  url: string | null
}
interface AiInsight {
  id: string
  summary: string
  confidence: string
  methodologyNote: string | null
  generatedAt: string
  sources: AiSource[]
  structuredOutput: { rankedCities?: { name: string; compositeScore: number; dataCompleteness: string }[] }
}
interface ReadinessScore {
  score: number
  drivers: { driverName: string; pointsEarned: number; pointsPossible: number }[]
}

const FEATURES = [
  { key: 'market-analysis', label: 'Market Analysis' },
  { key: 'consumer-insights', label: 'Consumer Insights' },
  { key: 'competitors', label: 'Competitor Intelligence' },
  { key: 'pricing', label: 'Pricing Intelligence' },
  { key: 'demand-forecast', label: 'Demand Forecast' },
  { key: 'cities', label: 'City Recommendations' },
] as const

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: 'tw-bg-green-100 tw-text-green-700',
    medium: 'tw-bg-blue-100 tw-text-blue-700',
    low: 'tw-bg-amber-100 tw-text-amber-700',
    insufficient_data: 'tw-bg-gray-100 tw-text-gray-500',
  }
  return (
    <span className={`tw-rounded tw-px-2 tw-py-0.5 tw-text-xs ${colors[confidence] ?? colors.insufficient_data}`}>
      {confidence.replace(/_/g, ' ')}
    </span>
  )
}

function InsightCard({ featureKey, label }: { featureKey: string; label: string }) {
  const [insight, setInsight] = useState<AiInsight | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/market-intelligence/${featureKey}`)
    if (res.ok) {
      const body = await res.json()
      setInsight(body.data)
    }
  }, [featureKey])

  useEffect(() => {
    load()
  }, [load])

  async function handleGenerate() {
    setLoading(true)
    await fetch(`/api/v1/market-intelligence/${featureKey}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    await load()
    setLoading(false)
  }

  return (
    <div className="tw-rounded tw-border tw-border-gray-200 tw-p-4">
      <div className="tw-mb-2 tw-flex tw-items-center tw-justify-between">
        <h3 className="tw-font-semibold">{label}</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-1 tw-text-xs disabled:tw-opacity-50"
        >
          {loading ? 'Generating…' : insight ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {!insight ? (
        <p className="tw-text-sm tw-text-gray-400">Not generated yet.</p>
      ) : (
        <>
          <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <ConfidenceBadge confidence={insight.confidence} />
            {insight.methodologyNote && (
              <span className="tw-text-xs tw-italic tw-text-gray-400">{insight.methodologyNote}</span>
            )}
          </div>
          <p className="tw-mb-2 tw-text-sm tw-text-gray-700">{insight.summary}</p>

          {insight.structuredOutput.rankedCities && (
            <ol className="tw-mb-2 tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              {insight.structuredOutput.rankedCities.map((c, i) => (
                <li key={c.name} className="tw-flex tw-justify-between">
                  <span>
                    {i + 1}. {c.name}
                  </span>
                  <span className="tw-text-gray-400">
                    {c.dataCompleteness === 'insufficient_data' ? 'insufficient data' : `${c.compositeScore}/100`}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {insight.sources.length > 0 && (
            <ul className="tw-flex tw-flex-col tw-gap-0.5">
              {insight.sources.map((s, i) => (
                <li key={i} className="tw-text-xs tw-text-gray-400">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="tw-underline">
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function ReadinessScoreCard() {
  const [score, setScore] = useState<ReadinessScore | null>(null)
  const [hasSecuredBudget, setHasSecuredBudget] = useState(false)
  const [hasDefinedTimeline, setHasDefinedTimeline] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/market-intelligence/readiness-score')
    if (res.ok) {
      const body = await res.json()
      setScore(body.data)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRecalculate() {
    setLoading(true)
    await fetch('/api/v1/market-intelligence/readiness-score/recalculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasSecuredBudget, hasDefinedTimeline }),
    })
    await load()
    setLoading(false)
  }

  return (
    <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
        <div>
          <div className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">Expansion Readiness Score</div>
          <div className="tw-text-3xl tw-font-semibold">{score?.score ?? '—'}/100</div>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm">
          <label className="tw-flex tw-items-center tw-gap-2">
            <input type="checkbox" checked={hasSecuredBudget} onChange={(e) => setHasSecuredBudget(e.target.checked)} />
            Budget secured
          </label>
          <label className="tw-flex tw-items-center tw-gap-2">
            <input type="checkbox" checked={hasDefinedTimeline} onChange={(e) => setHasDefinedTimeline(e.target.checked)} />
            Timeline defined
          </label>
          <button
            onClick={handleRecalculate}
            disabled={loading}
            className="tw-rounded tw-bg-gray-900 tw-px-3 tw-py-1 tw-text-xs tw-text-white disabled:tw-opacity-50"
          >
            {loading ? 'Calculating…' : 'Recalculate'}
          </button>
        </div>
      </div>

      {score && (
        <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-text-sm">
          {score.drivers.map((d) => (
            <div key={d.driverName}>
              <div className="tw-text-gray-400">{d.driverName.replace(/_/g, ' ')}</div>
              <div>
                {d.pointsEarned}/{d.pointsPossible}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// US-10-17 — AI Market Intelligence module.
export default function MarketIntelligencePage() {
  return (
    <AppShell>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Market Intelligence</h1>

      <ReadinessScoreCard />

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        {FEATURES.map((f) => (
          <InsightCard key={f.key} featureKey={f.key} label={f.label} />
        ))}
      </div>
    </AppShell>
  )
}
