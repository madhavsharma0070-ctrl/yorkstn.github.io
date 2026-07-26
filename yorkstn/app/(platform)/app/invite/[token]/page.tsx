'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

interface InvitePreview {
  organizationName: string
  role: string
  email: string
}

// US-02 (accept half). Public preview + accept flow for
// /api/v1/invitations/:token[/accept].
export default function InviteAcceptPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/invitations/${params.token}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) {
          setError(body.error?.message ?? 'This invitation is invalid.')
          return
        }
        setPreview(body.data)
      })
      .catch(() => setError('This invitation could not be loaded.'))
  }, [params.token])

  async function handleAccept() {
    setAccepting(true)
    const res = await fetch(`/api/v1/invitations/${params.token}/accept`, { method: 'POST' })
    const body = await res.json()
    setAccepting(false)

    if (!res.ok) {
      setError(body.error?.message ?? 'Could not accept invitation.')
      return
    }

    await update({ activeOrganizationId: body.data.organizationId })
    router.push('/app/dashboard')
    router.refresh()
  }

  if (error) {
    return (
      <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-md tw-flex-col tw-justify-center tw-px-6 tw-text-center">
        <p className="tw-text-sm tw-text-red-600">{error}</p>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-md tw-flex-col tw-justify-center tw-px-6 tw-text-center">
        <p className="tw-text-sm tw-text-gray-500">Loading invitation…</p>
      </div>
    )
  }

  return (
    <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-md tw-flex-col tw-justify-center tw-px-6 tw-text-center">
      <h1 className="tw-mb-2 tw-text-xl tw-font-semibold">Join {preview.organizationName}</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        You&apos;ve been invited as <strong>{preview.role.replace(/_/g, ' ')}</strong> ({preview.email}).
      </p>

      {status === 'unauthenticated' ? (
        <button
          onClick={() => signIn(undefined, { callbackUrl: `/app/invite/${params.token}` })}
          className="tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white"
        >
          Sign in to accept
        </button>
      ) : session?.user.email.toLowerCase() !== preview.email.toLowerCase() ? (
        <p className="tw-text-sm tw-text-red-600">
          You&apos;re signed in as {session?.user.email}, but this invitation was sent to{' '}
          {preview.email}.
        </p>
      ) : (
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
        >
          {accepting ? 'Joining…' : 'Accept invitation'}
        </button>
      )}
    </div>
  )
}
