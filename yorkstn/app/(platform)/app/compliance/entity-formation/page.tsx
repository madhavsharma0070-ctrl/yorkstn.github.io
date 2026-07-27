'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/platform/AppShell'

interface EntityFormationAnswers {
  intendsCommercialActivity: boolean
  hasSecuredSpecificContract: boolean
  wantsSeparateIndianEntity: boolean
  wantsLocalPartner: boolean
  preferredEntityForm: 'company' | 'llp'
}

interface WorkflowItem {
  id: string
  title: string
  status: string
  dueAt: string | null
}

interface RecommendationResult {
  recommendation: { recommendedEntityType: string; entityRationale: string }
  tasks: WorkflowItem[]
}

const DEFAULT_ANSWERS: EntityFormationAnswers = {
  intendsCommercialActivity: true,
  hasSecuredSpecificContract: false,
  wantsSeparateIndianEntity: true,
  wantsLocalPartner: false,
  preferredEntityForm: 'company',
}

// US-20 — Entity Formation questionnaire. The recommendation itself is
// deterministic (lib/modules/compliance/entity-formation/rules-engine.ts) —
// this page just collects inputs and renders the API's response, it does
// not compute anything client-side.
export default function EntityFormationPage() {
  const [answers, setAnswers] = useState<EntityFormationAnswers>(DEFAULT_ANSWERS)
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/v1/compliance/entity-formation/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    const body = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not generate a recommendation.')
      return
    }

    setResult(body.data)
  }

  return (
    <AppShell>
      <Link href="/app/compliance" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Compliance overview
      </Link>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Entity Formation</h1>

      {!result ? (
        <form onSubmit={handleSubmit} className="tw-flex tw-max-w-xl tw-flex-col tw-gap-4">
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
            <input
              type="checkbox"
              checked={answers.intendsCommercialActivity}
              onChange={(e) => setAnswers({ ...answers, intendsCommercialActivity: e.target.checked })}
            />
            We plan revenue-generating / commercial activity in India (not just market scoping)
          </label>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
            <input
              type="checkbox"
              checked={answers.hasSecuredSpecificContract}
              onChange={(e) => setAnswers({ ...answers, hasSecuredSpecificContract: e.target.checked })}
            />
            We have already secured a specific contract with an Indian entity
          </label>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
            <input
              type="checkbox"
              checked={answers.wantsSeparateIndianEntity}
              onChange={(e) => setAnswers({ ...answers, wantsSeparateIndianEntity: e.target.checked })}
            />
            We want a legally separate Indian entity (not just an extension of our foreign company)
          </label>
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
            <input
              type="checkbox"
              checked={answers.wantsLocalPartner}
              onChange={(e) => setAnswers({ ...answers, wantsLocalPartner: e.target.checked })}
            />
            We want an Indian equity partner (joint venture)
          </label>
          <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
            Preferred entity form
            <select
              className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
              value={answers.preferredEntityForm}
              onChange={(e) =>
                setAnswers({ ...answers, preferredEntityForm: e.target.value as 'company' | 'llp' })
              }
            >
              <option value="company">Private limited company</option>
              <option value="llp">Limited Liability Partnership (LLP)</option>
            </select>
          </label>

          {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="tw-mt-2 tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
          >
            {submitting ? 'Generating…' : 'Get recommendation'}
          </button>
        </form>
      ) : (
        <div className="tw-max-w-xl">
          <div className="tw-mb-6 tw-rounded tw-border tw-border-gray-200 tw-p-4">
            <div className="tw-mb-1 tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">
              Recommended entity type
            </div>
            <div className="tw-mb-3 tw-text-xl tw-font-semibold">
              {result.recommendation.recommendedEntityType.toUpperCase().replace(/_/g, ' ')}
            </div>
            <p className="tw-text-sm tw-text-gray-600">{result.recommendation.entityRationale}</p>
          </div>

          <h2 className="tw-mb-3 tw-text-lg tw-font-semibold">Your task checklist</h2>
          <ul className="tw-flex tw-flex-col tw-gap-2">
            {result.tasks.map((task) => (
              <li key={task.id} className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
                <span>{task.title}</span>
                <span className="tw-text-xs tw-text-gray-400">
                  {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : ''}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/compliance" className="tw-mt-6 tw-inline-block tw-text-sm tw-underline">
            View in Compliance overview →
          </Link>
        </div>
      )}
    </AppShell>
  )
}
