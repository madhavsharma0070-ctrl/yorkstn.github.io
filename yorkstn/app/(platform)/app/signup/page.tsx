'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// US-01 (signup half). Creates the user via /api/v1/auth/signup, then signs
// in immediately so the caller lands authenticated, then routes to
// onboarding to create their organization.
export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const body = await res.json()

    if (!res.ok) {
      setError(body.error?.message ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }

    const signInResult = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (signInResult?.error) {
      setError('Account created — please sign in.')
      router.push('/app/login')
      return
    }

    router.push('/app/onboarding')
  }

  return (
    <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-md tw-flex-col tw-justify-center tw-px-6">
      <h1 className="tw-mb-1 tw-text-2xl tw-font-semibold">Create your Yorkstn account</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        Start your India market-entry expansion plan.
      </p>

      <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-4">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Full name
          <input
            required
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Work email
          <input
            required
            type="email"
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Password
          <input
            required
            type="password"
            minLength={8}
            className="tw-rounded tw-border tw-border-gray-300 tw-px-3 tw-py-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        {error && <p className="tw-text-sm tw-text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="tw-mt-2 tw-rounded tw-bg-gray-900 tw-py-2 tw-text-white disabled:tw-opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="tw-mt-6 tw-text-sm tw-text-gray-500">
        Already have an account?{' '}
        <Link href="/app/login" className="tw-underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
