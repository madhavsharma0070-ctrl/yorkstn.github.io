'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setSubmitting(false)

    if (result?.error) {
      setError('Invalid email or password.')
      return
    }

    router.push('/app/dashboard')
    router.refresh()
  }

  return (
    <div className="tw-mx-auto tw-flex tw-min-h-screen tw-max-w-md tw-flex-col tw-justify-center tw-px-6">
      <h1 className="tw-mb-1 tw-text-2xl tw-font-semibold">Sign in to Yorkstn</h1>
      <p className="tw-mb-6 tw-text-sm tw-text-gray-500">
        Demo accounts: any <code>@demo.yorkstn.com</code> address seeded via <code>npm run db:seed</code>, password{' '}
        <code>password123</code>.
      </p>

      <form onSubmit={handleSubmit} className="tw-flex tw-flex-col tw-gap-4">
        <label className="tw-flex tw-flex-col tw-gap-1 tw-text-sm">
          Email
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="tw-mt-6 tw-text-sm tw-text-gray-500">
        New brand?{' '}
        <Link href="/app/signup" className="tw-underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
