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

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    userType: UserType
    activeOrganizationId?: string | null
  }
}
