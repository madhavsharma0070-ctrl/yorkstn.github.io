# Yorkstn — Authentication & RBAC

**Depends on:** `DATABASE_SCHEMA.md` §0.2 (RBAC modeling decision), `PERSONAS.md`, `INFORMATION_ARCHITECTURE.md` §3

## 1. Authentication approach

**Recommendation: NextAuth.js (Auth.js) v5**, credentials provider (email + password, bcrypt-hashed via `password_hash`) as the MVP default, with the adapter/schema already accommodating OAuth providers (`accounts`/`sessions`/`verification_tokens` tables exist per `DATABASE_SCHEMA.md` §1.1) as a documented, not-yet-built extension point.

**Why:** it is the standard, actively maintained auth library for Next.js App Router, has a first-class Prisma adapter (matching the chosen ORM per `TECH_STACK.md`), and lets Yorkstn add Google/Microsoft SSO post-MVP (plausible given the B2B ICP) without a schema migration.

**Session strategy: JWT, not database sessions.** **[Design decision]** A JWT session (signed, short-lived access token + refresh) avoids a `sessions` table read on every request — relevant given the dashboard's aggregated endpoint (`GET /dashboard`) and the AI-insight endpoints are the hottest paths. The `sessions` table from the Prisma adapter schema stays defined (for future OAuth compatibility) but is unused by the credentials+JWT flow in MVP.

**Session claims:** `userId`, `userType` (`org_user`\|`yorkstn_staff`\|`partner`), and for `org_user` sessions, the currently **active** `organizationId` (see `API_SPECIFICATION.md` §0.4 for how it's switched). Claims are re-validated against the DB on each write request (not trusted blindly from an old token) for role changes to take effect immediately rather than only after token refresh — **[Design decision]**: a short (5–15 min) JWT expiry with silent refresh is the practical way to bound this staleness window without a full DB round-trip per read request.

## 2. Full RBAC permission matrix

Roles: the five `membership_role` enum values (`owner`, `admin`, `compliance_manager`, `analyst_editor`, `viewer`) apply only to `user_type='org_user'`. `yorkstn_staff` and `partner` are separate `user_type`s with their own access model (§3, §4) — they never hold a `membership_role`.

| Resource / Action | owner | admin | compliance_manager | analyst_editor | viewer |
|---|---|---|---|---|---|
| Org profile — view | ✓ | ✓ | ✓ | ✓ | ✓ |
| Org profile — edit | ✓ | ✓ | — | — | — |
| Billing — view | ✓ | ✓ | — | — | — |
| Billing — edit / tier change | ✓ | — | — | — | — |
| Members — invite/edit role/remove | ✓ | ✓ | — | — | — |
| Audit log — view | ✓ | ✓ | — | — | — |
| Org deletion / ownership transfer | ✓ | — | — | — | — |
| Market Intelligence — view | ✓ | ✓ | read-only | ✓ | read-only |
| Market Intelligence — trigger regeneration | ✓ | ✓ | — | ✓ | — |
| Readiness Score — view/recalculate | ✓ | ✓ | ✓ | ✓ | read-only |
| Compliance — view | ✓ | ✓ | ✓ | read-only | read-only |
| Compliance — edit workflow items / upload documents | ✓ | ✓ | ✓ | — | — |
| Entity-formation recommendation — request | ✓ | ✓ | ✓ | — | — |
| Partners — search/view | ✓ | ✓ | read-only | ✓ | read-only |
| Partners — send introduction request | ✓ | ✓ | — | ✓ | — |
| Expansion (cities/malls/sites/roadmap) — view | ✓ | ✓ | read-only | ✓ | read-only |
| Expansion — edit (sites, scoring, roadmap, projections, launch tasks) | ✓ | ✓ | — | ✓ | — |
| Managed Services — request engagement | ✓ | ✓ | ✓ | read-only | read-only |
| Notifications — own | ✓ | ✓ | ✓ | ✓ | ✓ |

This is the literal expansion of the summary table in `INFORMATION_ARCHITECTURE.md` §3, at the resource-action level `API_SPECIFICATION.md` actually enforces per-route.

## 3. Yorkstn Staff — cross-org, assignment-scoped access

- A `yorkstn_staff` user has **zero** organizations visible by default. Visibility is granted per-org via a `staff_org_assignments` row (`DATABASE_SCHEMA.md` §1.1) — created when a managed-services engagement is scoped to them, or by a platform super-admin (a `yorkstn_staff` sub-flag, **[Design decision]**: not a separate `user_type`, since "can assign other staff to orgs" is itself just another permission a small number of staff accounts have — modeled as a boolean `is_platform_admin` column on `users`, checked only within `/admin/**` routes).
- Within an assigned org, staff access is **scoped to Compliance OS (case management) and Partner verification** per `PERSONAS.md` #5 — staff do **not** get blanket read access to Market Intelligence, Financial Projections, or other brand-strategic data merely by being assigned for a compliance engagement. This is enforced as a second dimension alongside `staff_org_assignments`: assignment rows carry a `scope` (`compliance` \| `partner_verification` \| `full`), and the authorization helper checks both "is this org assigned to me" and "does my assignment's scope cover this resource."
- All `yorkstn_staff` actions on a client org write to `audit_logs` with the acting staff user as `actor_user_id` — the brand-side `owner`/`admin` can always see exactly what a staff member did on their org (no privileged, invisible access).

## 4. Partner isolation

- A `partner` user (`users.user_type='partner'`, linked 1:1 via `users.partner_id`/`partners.contact_user_id`) **never** has a `memberships` row and can never read or be granted access to any `organizations`-scoped data. Their entire surface is the `/partner-portal/**` route group (`API_SPECIFICATION.md` §5) plus the shared, non-tenant-scoped `partners`/`cities`/`malls` reference tables where relevant to their own profile.
- A partner can see: their own profile (all fields, including `rejectionReason`), introduction requests **addressed to them** (never another partner's), and nothing else. They cannot enumerate `organizations`, cannot see another partner's `capacity_attributes`, and cannot see `partner_verifications` review history beyond their own latest decision.
- **Enforcement point:** every `/partner-portal/**` route handler's first line resolves `session.userId → partners.id` via the unique `contact_user_id` FK and scopes all queries to that single `partner_id` — there is no "list all partners" capability in this route group, unlike the brand-side `/partners` search.

## 5. Defense in depth — the hard rule

**UI-level hiding of a control (e.g., a disabled "Edit" button for a `viewer` role) is a UX convenience only.** Every mutating API route independently re-derives the caller's role/assignment/partner-identity from the session and DB on the server, before touching business logic — this is what AC US-60/61 actually tests (a role without a permission gets a 403 from the API directly, exercised by a test that calls the route handler with a crafted session, not by clicking through the UI). A single shared `requirePermission(session, resource, action, resourceOrgId)` helper is used by every route handler (`API_SPECIFICATION.md` implies its call sites throughout) so this check is never hand-rolled per-route and cannot silently be forgotten on a new endpoint.

## 6. Tenant isolation as a security invariant (cross-reference)

Every organization-scoped query is filtered by the session's active `organizationId`, sourced from the server-side session — **never** accepted as a client-supplied parameter (`API_SPECIFICATION.md` §0.1). This is restated here because it is the single most important authorization invariant in the whole system (see `SECURITY_ARCHITECTURE.md` for the full defense-in-depth treatment, including the Prisma middleware/query-scoping pattern that makes forgetting this check structurally harder, not just procedurally discouraged).
