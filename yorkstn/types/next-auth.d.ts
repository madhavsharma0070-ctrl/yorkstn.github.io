import type { UserType } from '@/lib/validation/enums'

// Augments Auth.js's session/JWT shape with the claims AUTH_RBAC.md §1 defines:
// userId, userType, and (for org_user sessions) the active organizationId.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      userType: UserType
      activeOrganizationId?: string | null
    }
  }

  interface User {
    userType: UserType
  }
}

// NOTE: `next-auth/jwt` merely re-exports `@auth/core/jwt` (`export * from
// "@auth/core/jwt"`) in this version — it does not declare the `JWT`
// interface itself. TypeScript's declaration merging only applies where an
// interface is actually declared, so this augmentation must target
// `@auth/core/jwt` directly or it silently has no effect (every `token.*`
// access falls back to the base interface's `Record<string, unknown>` index
// signature, typed `unknown`).
declare module '@auth/core/jwt' {
  interface JWT {
    userId: string
    userType: UserType
    activeOrganizationId?: string | null
  }
}
