'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['fashion', 'lifestyle', 'kids', 'beauty_personal_care', 'home_living', 'specialty'] as const
const PRICE_TIERS = ['mass', 'mid', 'premium', 'luxury'] as const

// US-01 — onboarding wizard: org creation, then brand profile, then activates
// the new org as the session's active organization before landing on the
// dashboard (API_SPECIFICATION.md §0.4's session-update flow).
export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState<'org' | 'brand'>('org')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [org, setOrg] = useState({ name: '', homeCountry: '' })
  const [brand, setBrand] = useState({
    category: CATEGORIES[0] as string,
    priceTier: PRICE_TIERS[0] as string,
  })

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/v1/onboarding/organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(org),
    })
    const body = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not create organization.')
      return
    }

    // Validate + persist the new org as the active session organization
    // (session/active-organization validates; useSession().update() persists
    // the claim via the jwt callback's trigger:'update' path — auth.ts).
    await fetch('/api/v1/session/active-organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: body.data.id }),
    })
    await update({ activeOrganizationId: body.data.id })

    setStep('brand')
  }

  async function handleBrandSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/v1/onboarding/brand-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brand),
    })
    setSubmitting(false)

    if (!res.ok) {
      const body = await res.json()
      setError(body.error?.message ?? 'Could not save brand profile.')
      return
    }

    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-lg tw-flex-col tw-justify-center tw-px-6">
      <p className="tw-mb-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-400">
        Step {step === 'org' ? '1' : '2'} of 2
      </p>

      {step === 'org' ? (
        <>
          <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Tell us about your organization</h1>
          <form onSubmit={handleOrgSubmit} className="tw-flex tw-flex-col tw-gap-4">
            <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              Organization name
              <input
                required
                className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
              />
            </label>
            <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              Home country
              <input
                required
                placeholder="e.g. United States"
                className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                value={org.homeCountry}
                onChange={(e) => setOrg({ ...org, homeCountry: e.target.value })}
              />
            </label>
            {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="tw-mt-2 tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
            >
              {submitting ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Tell us about your brand</h1>
          <form onSubmit={handleBrandSubmit} className="tw-flex tw-flex-col tw-gap-4">
            <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              Category
              <select
                className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                value={brand.category}
                onChange={(e) => setBrand({ ...brand, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
              Price tier
              <select
                className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                value={brand.priceTier}
                onChange={(e) => setBrand({ ...brand, priceTier: e.target.value })}
              >
                {PRICE_TIERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="tw-mt-2 tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
            >
              {submitting ? 'Saving…' : 'Finish setup'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
