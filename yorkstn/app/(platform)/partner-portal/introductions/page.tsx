'use client'

import { useEffect, useState, useCallback } from 'react'

interface IntroRequest {
  id: string
  status: string
  context: string | null
  organization: { name: string }
}

// US-33 — partner-side introduction requests.
export default function PartnerIntroductionsPage() {
  const [requests, setRequests] = useState<IntroRequest[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/partner-portal/introduction-requests')
    if (res.ok) {
      const body = await res.json()
      setRequests(body.data)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function respond(id: string, status: 'accepted' | 'declined') {
    await fetch(`/api/v1/partner-portal/introduction-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  return (
    <div className="tw-mx-auto tw-max-w-xl">
      <a href="/partner-portal/profile" className="tw-mb-4 tw-inline-block tw-text-sm tw-text-gray-400 hover:tw-underline">
        ← Profile
      </a>
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Introduction Requests</h1>

      <ul className="tw-flex tw-flex-col tw-gap-3">
        {requests.map((r) => (
          <li key={r.id} className="tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
            <div className="tw-mb-1 tw-flex tw-items-center tw-justify-between">
              <span className="tw-font-medium">{r.organization.name}</span>
              <span className="tw-text-xs tw-text-gray-400">{r.status.replace(/_/g, ' ')}</span>
            </div>
            {r.context && <p className="tw-mb-2 tw-text-gray-600">{r.context}</p>}
            {(r.status === 'sent' || r.status === 'partner_viewed') && (
              <div className="tw-flex tw-gap-2">
                <button onClick={() => respond(r.id, 'accepted')} className="tw-rounded tw-bg-green-600 tw-px-3 tw-py-1 tw-text-xs tw-text-white">
                  Accept
                </button>
                <button onClick={() => respond(r.id, 'declined')} className="tw-rounded tw-bg-red-600 tw-px-3 tw-py-1 tw-text-xs tw-text-white">
                  Decline
                </button>
              </div>
            )}
          </li>
        ))}
        {requests.length === 0 && <p className="tw-text-sm tw-text-gray-400">No introduction requests yet.</p>}
      </ul>
    </div>
  )
}
