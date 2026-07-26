import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'

/**
 * Auth.js v5, Credentials provider + JWT sessions — the approach documented in
 * docs/phase2/AUTH_RBAC.md §1 (D-10 in DECISIONS.md). No database-session
 * strategy and no Prisma adapter are wired: Credentials + JWT doesn't need
 * them, and adding the adapter's Account/Session/VerificationToken tables is
 * deferred until OAuth is actually built (AUTH_RBAC.md's documented future
 * extension, not an MVP requirement).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') return null

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (!user || !user.passwordHash) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType as 'org_user' | 'yorkstn_staff' | 'partner',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // `user.id` is optional on Auth.js's base `User` type, but our
      // `authorize()` above always returns a real Prisma id — this guard is
      // for type-narrowing correctness, not because it's expected to trigger.
      if (user && user.id) {
        token.userId = user.id
        token.userType = user.userType

        // On first login, default the active org to the user's first
        // membership (if any) so a returning user lands somewhere useful;
        // a brand-new user with no memberships stays undefined and is routed
        // to onboarding (see app/app/onboarding).
        if (user.userType === 'org_user') {
          const firstMembership = await prisma.membership.findFirst({
            where: { userId: user.id, status: 'active' },
            orderBy: { createdAt: 'asc' },
          })
          token.activeOrganizationId = firstMembership?.organizationId ?? null
        }
      }

      // Organization switching (API_SPECIFICATION.md §0.4): the client calls
      // useSession().update({ activeOrganizationId }) after POSTing
      // /api/v1/session/active-organization, which validates membership
      // server-side first — this callback trusts that validation already
      // happened and just persists the claim into the token.
      if (trigger === 'update' && session?.activeOrganizationId) {
        token.activeOrganizationId = session.activeOrganizationId
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId
      session.user.userType = token.userType
      session.user.activeOrganizationId = token.activeOrganizationId ?? null
      return session
    },
  },
})
