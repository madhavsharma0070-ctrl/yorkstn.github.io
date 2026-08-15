'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/app/login' })}
      className="tw-block tw-w-full tw-rounded tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-gray-500 hover:tw-bg-gray-100"
    >
      Sign out
    </button>
  )
}
