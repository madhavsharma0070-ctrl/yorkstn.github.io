'use client'

import { useEffect, useState, useCallback } from 'react'

interface QueueItem {
  id: string
  submittedAt: string
  partner: { id: string; businessName: string; category: string }
}

export function AdminVerificationQueueClient() {
  const [queue, setQueue] = useState<QueueItem[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/partner-verification-queue')
    if (res.ok) {
      const body = await res.json()
      setQueue(body.data)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    const reason = decision === 'rejected' ? window.prompt('Rejection reason (visible only to the partner):') ?? '' : undefined
    await fetch(`/api/v1/admin/partner-verification-queue/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason }),
    })
    load()
  }

  return (
    <div className="tw-mx-auto tw-max-w-2xl tw-p-8">
      <h1 className="tw-mb-6 tw-text-2xl tw-font-semibold">Partner Verification Queue</h1>
      {queue.length === 0 ? (
        <p className="tw-text-sm tw-text-gray-400">No pending submissions.</p>
      ) : (
        <ul className="tw-flex tw-flex-col tw-gap-3">
          {queue.map((item) => (
            <li key={item.id} className="tw-flex tw-items-center tw-justify-between tw-rounded tw-border tw-border-gray-200 tw-p-3 tw-text-sm">
              <div>
                <div className="tw-font-medium">{item.partner.businessName}</div>
                <div className="tw-text-gray-400">{item.partner.category.replace(/_/g, ' ')}</div>
              </div>
              <div className="tw-flex tw-gap-2">
                <button
                  onClick={() => decide(item.id, 'approved')}
                  className="tw-rounded tw-bg-green-600 tw-px-3 tw-py-1 tw-text-xs tw-text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(item.id, 'rejected')}
                  className="tw-rounded tw-bg-red-600 tw-px-3 tw-py-1 tw-text-xs tw-text-white"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
