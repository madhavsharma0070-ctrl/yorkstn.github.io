'use client'

import { useEffect, useState } from 'react'

interface OwnProfile {
  id: string
  businessName: string
  category: string
  description: string | null
  verificationStatus: string
  verifications: { status: string; submittedAt: string; rejectionReason: string | null }[]
}

// US-34 — partner self-service profile + verification submission.
export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<OwnProfile | null>(null)
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/v1/partner-portal/profile')
      .then((res) => res.json())
      .then((body) => {
        setProfile(body.data)
        setDescription(body.data.description ?? '')
      })
  }, [])

  async function handleSave() {
    await fetch('/api/v1/partner-portal/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
  }

  async function handleSubmitVerification() {
    await fetch('/api/v1/partner-portal/verification', { method: 'POST' })
    setSubmitted(true)
  }

  if (!profile) return null

  const latestRejection = profile.verifications.find((v) => v.status === 'rejected')

  return (
    <div className="tw-mx-auto tw-max-w-xl">
      <h1 className="tw-mb-2 tw-text-2xl tw-font-semibold">{profile.businessName}</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        Status: {profile.verificationStatus}
        {latestRejection?.rejectionReason && (
          <span className="tw-ml-2 tw-text-red-600">(Last rejection reason: {latestRejection.rejectionReason})</span>
        )}
      </p>

      <label className="tw-mb-4 tw-flex tw-flex-col tw-gap-1 tw-text-sm">
        Description
        <textarea
          className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <button onClick={handleSave} className="tw-mb-6 tw-rounded tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm">
        Save
      </button>

      <div>
        {submitted || profile.verificationStatus === 'pending' ? (
          <p className="tw-text-sm tw-text-gray-500">Verification submission is pending review.</p>
        ) : (
          <button
            onClick={handleSubmitVerification}
            className="tw-rounded tw-bg-gray-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white"
          >
            Submit for verification
          </button>
        )}
      </div>

      <a href="/partner-portal/introductions" className="tw-mt-8 tw-inline-block tw-text-sm tw-underline">
        View introduction requests →
      </a>
    </div>
  )
}
