# Yorkstn — REST API Specification

**Depends on:** `DATABASE_SCHEMA.md`, `AUTH_RBAC.md`, `FEATURE_SPECIFICATIONS.md`
**Base path:** `/api/v1` (Next.js Route Handlers under `app/api/v1/**`). **[Design decision]** versioning via URL prefix, not header-based, since it's simpler to reason about in a Next.js App Router file tree and the API has no external third-party consumers in MVP (it serves only the Yorkstn frontend).

---

## 0. Conventions

### 0.1 Auth
Every endpoint except `POST /auth/signup`, `POST /auth/login`, and `POST /invitations/:token/accept` requires a valid session (see `AUTH_RBAC.md` for the NextAuth.js/Auth.js JWT session strategy). The session carries `userId`, `userType`, and — for `org_user` sessions — the **currently active** `organizationId` (set via the organization-switcher; see §0.4). Every organization-scoped endpoint below implicitly filters by this active `organizationId` — it is never accepted as a client-supplied body/query parameter, to prevent a client from asserting access to a different tenant.

### 0.2 Standard error envelope
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action.",
    "details": {}
  }
}
```
Standard codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422, with `details.fields`), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500). All request bodies are validated with Zod (see `TECH_STACK.md`) at the route boundary before touching business logic — a `VALIDATION_ERROR` is returned before any DB call.

### 0.3 Pagination & filtering (list endpoints)
Cursor-based: `?limit=20&cursor=<opaque>`. Response shape:
```json
{ "data": [ /* items */ ], "nextCursor": "opaque-string-or-null" }
```
Filtering uses explicit query params per resource (documented per endpoint below), not a generic query-language — keeps validation simple and matches the fixed filter sets defined in `FEATURE_SPECIFICATIONS.md` (e.g., Partner search's category/city/verification-status filters).

### 0.4 Organization switching
`POST /session/active-organization { organizationId }` — validates the caller has a `memberships` row (or `staff_org_assignments` row, for staff) for that org, then updates the session claim. Not itself organization-scoped (it's how you change which org subsequent calls are scoped to).

### 0.5 Rate limiting
Per-user token-bucket limits at the middleware layer (see `SECURITY_ARCHITECTURE.md`): 100 req/min general, 10 req/min on AI-generation endpoints (§3) given their higher compute cost, 5 req/min on auth endpoints to blunt credential-stuffing.

---

## 1. Auth & Onboarding

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/signup` | none | `{ email, password, name }` → creates `users` row (`user_type='org_user'`) + starts onboarding; no organization yet |
| POST | `/auth/login` | none | `{ email, password }` → session |
| POST | `/auth/logout` | session | |
| POST | `/onboarding/organization` | session, no active org yet | `{ name, homeCountry }` → creates `organizations` + a `membership` row with `role='owner'` for the caller |
| POST | `/onboarding/brand-profile` | session + active org | `{ category, subCategory, priceTier, homeMarketPriceRange }` → creates `brand_profiles` (US-01) |
| POST | `/invitations` | session (`owner`\|`admin`) | `{ email, role }` → creates `invitations` row, queues email (US-02) |
| GET | `/invitations/:token` | none | resolves token → org name + role, for the accept-screen preview |
| POST | `/invitations/:token/accept` | session (any authenticated user) | creates `memberships` row, marks invitation `accepted` |

**Example response — `GET /invitations/:token` (expired):**
```json
{ "error": { "code": "CONFLICT", "message": "This invitation has expired.", "details": { "status": "expired" } } }
```

---

## 2. Organizations, Members, Settings

| Method | Path | Auth (min. role) | Notes |
|---|---|---|---|
| GET | `/organizations/me` | any org role | list orgs the caller belongs to (org-switcher data) |
| GET | `/organizations/current` | any org role | active org detail + brand profile |
| PATCH | `/organizations/current` | `owner`\|`admin` | update org/brand profile |
| GET | `/organizations/current/members` | any org role | list memberships |
| PATCH | `/organizations/current/members/:membershipId` | `owner`\|`admin` | change role or `status` (suspend) |
| DELETE | `/organizations/current/members/:membershipId` | `owner`\|`admin` | remove member |
| GET | `/organizations/current/audit-log` | `owner`\|`admin` | paginated `audit_logs`, filter by `entityType`, `dateFrom`/`dateTo` |
| GET | `/organizations/current/billing` | `owner`\|`admin` | subscription tier/status (US-62) |
| PATCH | `/organizations/current/billing` | `owner` only | tier change — MVP: manual/stubbed, see `TECH_STACK.md` payments note |

---

## 3. AI Market Intelligence

All GET endpoints in this section return the **latest** `ai_insights` row of the relevant `category` for the active org (per `DATABASE_SCHEMA.md`'s "latest-per-category" index); POST endpoints trigger (re)generation. Every response follows the AI Output Standard envelope.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/market-intelligence/market-analysis` | any org role | latest `category='market_analysis'` insight |
| POST | `/market-intelligence/market-analysis/generate` | `owner`\|`admin`\|`analyst_editor` | triggers regeneration (rate-limited, §0.5) |
| GET \| POST .../generate | `/market-intelligence/consumer-insights?cityId=` | same pattern | `cityId` optional query param scopes the insight |
| GET \| POST .../generate | `/market-intelligence/competitors` | same pattern | |
| GET \| POST .../generate | `/market-intelligence/pricing` | same pattern | reads `products.hsn_code` + Compliance duty data when available (feature spec 1.4) |
| GET \| POST .../generate | `/market-intelligence/demand-forecast` | same pattern | response `structured_output` includes `methodologyNote: "proxy-based (no first-party sales history)"` per US-14 |
| GET \| POST .../generate | `/market-intelligence/cities` | same pattern | accepts optional `?weights=` query (JSON-encoded criteria weights, US-15) |
| GET | `/market-intelligence/readiness-score` | any org role | latest `expansion_readiness_scores` + `readiness_score_drivers`; **not** a `.../generate` endpoint pattern — see below |
| POST | `/market-intelligence/readiness-score/recalculate` | any org role | deterministic — recomputes from current Compliance/Market/Capital state; same inputs always yield the same `score` (AC US-16), unit-tested at the scoring-function level, not just at the API contract level |

**Example — `GET /market-intelligence/cities` response:**
```json
{
  "id": "uuid", "category": "city_recommendation", "confidence": "medium",
  "summary": "Mumbai, Bengaluru, and Delhi NCR rank highest for premium kids apparel given category fit and distribution maturity.",
  "structuredOutput": {
    "rankedCities": [
      { "cityId": "uuid", "name": "Mumbai", "compositeScore": 82, "drivers": { "competitiveDensity": 70, "realEstateCost": 60, "distributionMaturity": 90, "demographicFit": 88 } }
    ]
  },
  "sources": [{ "title": "research/india-market-entry-regulatory-landscape.md §14", "url": null, "retrievedDate": "2026-07-23" }],
  "assumptions": ["City-tier distribution-maturity signal is directional, not a licensed real-time feed — see AI_ARCHITECTURE.md"],
  "generatedAt": "2026-07-24T10:00:00Z", "modelVersion": "mock-v1"
}
```

---

## 4. Compliance Operating System

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/compliance/overview` | any org role | cross-workflow timeline: all `compliance_workflow_items` across all 5 `workflow_type`s, sorted by `due_at` (US-26) |
| GET | `/compliance/:workflowType` | any org role | `workflowType` ∈ `entity_formation\|import\|gst\|bis\|trademark_ip`; returns the `compliance_case` + its `compliance_workflow_items` |
| POST | `/compliance/entity-formation/recommend` | `compliance_manager`\|`owner`\|`admin` | `{ operatingModel, fdiSensitivity, timeline }` → deterministic rules-engine call (not AI); response includes `recommendedEntityType`, `rationale`, `ruleEngineVersion`, and auto-creates the task checklist as new `compliance_workflow_items` rows (US-20) |
| PATCH | `/compliance/workflow-items/:id` | `compliance_manager`\|`owner`\|`admin` | update `status`, `dueAt`, `payload` |
| POST | `/compliance/workflow-items/:id/documents` | `compliance_manager`\|`owner`\|`admin` | multipart upload → new `documents` + `document_versions` row (US-25); rejects disallowed MIME types/oversize per `SECURITY_ARCHITECTURE.md` |
| GET | `/compliance/workflow-items/:id/documents` | any org role | latest version per `document_group`, with full version history on `?includeHistory=true` |
| GET | `/compliance/import/hsn-lookup?code=` | any org role | returns applicable IEC/DGFT/BIS/labelling checklist rules for the HSN code (Category-b curated lookup, not AI — see `AI_ARCHITECTURE.md`) |

**Note on `PATCH` write authorization:** the API independently re-checks role on every write (never trusts that the UI already hid the control) — the exact enforcement referenced in AC US-60/61 and `AUTH_RBAC.md` §"defense in depth."

---

## 5. Partner Discovery

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/partners` | any org role | filters: `category`, `cityId`, `verificationStatus` (defaults to `verified` only unless explicitly widened — US-31's "visibly labeled if unverified" requirement applies when widened) |
| GET | `/partners/:id` | any org role | full profile; `rejectionReason` and internal `partner_verifications` history are stripped from this response for non-staff callers |
| POST | `/partners/:id/introduction-requests` | `owner`\|`admin`\|`analyst_editor` | `{ context }` → creates `introduction_requests` row, status `sent`, triggers a `notification` to the partner (US-33) |
| GET | `/partners/introduction-requests` | any org role | the org's sent requests, filter by `status` |
| GET | `/market-intelligence/partner-recommendations` | any org role | AI-generated ranked matches (feature spec 3.3), same AI Output Standard envelope as §3, but partner-linked (`structuredOutput.partnerId`, `matchingSignals`) |
| **Partner-portal endpoints (separate auth context, `user_type='partner'`):** | | | |
| GET/PATCH | `/partner-portal/profile` | partner session | own `partners` row only (enforced via `contact_user_id = session.userId`) |
| POST | `/partner-portal/verification` | partner session | submits/resubmits — creates a `partner_verifications` row `status='pending'` (US-34) |
| GET | `/partner-portal/introduction-requests` | partner session | requests received, with `PATCH .../:id { status: 'accepted'|'declined' }` |
| **Yorkstn Staff verification queue:** | | | |
| GET | `/admin/partner-verification-queue` | `yorkstn_staff` | pending `partner_verifications`, oldest-first |
| POST | `/admin/partner-verification-queue/:id/decision` | `yorkstn_staff` | `{ decision: 'approved'|'rejected', reason? }` (US-35) |

---

## 6. Retail Expansion Intelligence

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/expansion/cities/:cityId` | any org role | city intelligence detail (US-40); public reference data, not org-scoped, but requires an authenticated org session to view (no anonymous access to the content corpus) |
| GET | `/expansion/malls/:mallId` | any org role | mall intelligence detail (US-41) |
| GET | `/expansion/sites` | any org role | org's candidate `sites`, with `computedScore`/`scoreBreakdown` |
| POST | `/expansion/sites` | `analyst_editor`\|`owner`\|`admin` | add a candidate site (optionally `crePartnerId` from Partner Discovery) |
| PATCH | `/expansion/sites/:id` | `analyst_editor`\|`owner`\|`admin` | update attributes/status |
| PUT | `/expansion/site-scoring-config` | `analyst_editor`\|`owner`\|`admin` | replace `weights`; triggers deterministic recompute of all `sites.computedScore` for the org (US-42) |
| GET | `/expansion/roadmap` | any org role | `expansion_roadmaps` + `roadmap_milestones` (US-43) |
| PATCH | `/expansion/roadmap/milestones/:id` | `analyst_editor`\|`owner`\|`admin` | update `status`; auto-updates when `linkedEntityId` state changes elsewhere (e.g., a linked Compliance item completing) |
| GET | `/expansion/financial-projections` | any org role | list; `POST` to create, `PATCH /:id` to update assumptions (US-44) — response separates `userAssumptions` from `platformBenchmarks` fields, never merges them |
| GET \| POST \| PATCH | `/expansion/launch-tasks[/:id]` | `analyst_editor`\|`owner`\|`admin` (read: any) | (US-45) |
| GET | `/dashboard` | any org role | aggregated: latest readiness score, top-N open compliance items by due date, partner introduction-request status counts, roadmap milestone progress (US-46) — a single composed endpoint rather than the client fanning out four calls, to keep the Expansion Dashboard's initial load fast |

---

## 7. Managed Services

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/managed-services/engagements` | `owner`\|`admin`\|`compliance_manager` | `{ scope, linkedComplianceItemId? }` (US-50) |
| GET | `/managed-services/engagements` | any org role | org's engagements |
| PATCH | `/managed-services/engagements/:id` | `yorkstn_staff` (assigned) | `{ status, notes }` — visible immediately in the brand's own dashboard, per US-51 (no separate off-platform channel) |

---

## 8. Notifications

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/notifications` | session | caller's own, filter `?unreadOnly=true` |
| PATCH | `/notifications/:id/read` | session | marks `readAt` |

---

## 9. Endpoints deliberately not in MVP

Per the PRD's non-goals, there is intentionally **no** `/payments`, `/escrow`, or `/transactions` resource, and no endpoint that returns free-text legal/tax advice (Compliance endpoints return workflow/checklist state and citations only — see `AI_ARCHITECTURE.md`'s Category (c)/(b) split for why entity-formation recommendations are a rules-engine call, never a "generate legal advice" prompt).
