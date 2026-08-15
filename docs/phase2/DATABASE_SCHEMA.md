# Yorkstn — Database Schema

**Dialect:** PostgreSQL 15+
**Depends on:** `PRD.md`, `PERSONAS.md`, `INFORMATION_ARCHITECTURE.md`, `FEATURE_SPECIFICATIONS.md`, `ACCEPTANCE_CRITERIA.md`
**Status:** Phase 2 design baseline. Where a call was needed that the source docs don't specify, it is marked **[Design decision]** with a one-line rationale — these are autonomous engineering judgment calls, not open questions.

This document is organized in two sections:
1. **Section 1 — Relational schema** (dialect-neutral column/constraint tables, the source of truth for reasoning about the model).
2. **Section 2 — Prisma schema** (a complete, valid `schema.prisma` reference implementation of Section 1, since the codebase is TypeScript/Next.js and Prisma is the natural ORM choice for this stack).

Everything after Section 2 (indexing strategy, soft-delete policy, multi-tenancy enforcement) applies to both.

---

## 0. Conventions

- **Primary keys:** `uuid` everywhere, default `gen_random_uuid()` (via `pgcrypto`/`pgcrypto`-equivalent `uuid-ossp`, or Postgres 13+'s built-in `gen_random_uuid()`). **[Design decision]** UUIDs avoid leaking sequential org/record counts across tenants and are safe to generate client-side offline (useful for optimistic UI).
- **Timestamps:** `timestamptz`, UTC. Every table has `created_at timestamptz not null default now()`; mutable tables also have `updated_at timestamptz not null default now()` (application/trigger-maintained on update).
- **Tenancy:** every tenant-scoped table carries `organization_id uuid not null references organizations(id)` (see §"Multi-Tenancy Enforcement"). Global/reference tables (e.g., `cities`) and identity tables (`users`) are the explicit exceptions, called out per table.
- **Enums:** modeled as native Postgres `ENUM` types (declared once, reused across tables). Application code should still treat these as a closed list owned by the codebase (Prisma enums), not something end users extend.
- **Money:** `numeric(14,2)` plus a `currency char(3)` (ISO 4217) column wherever a monetary value is stored outside a `jsonb` blob, since brands' home-market pricing may be non-INR.
- **Soft vs. hard delete:** see dedicated section below — decided per table, not uniformly.

### 0.1 Enumerated types (declared once, referenced by many tables)

```sql
CREATE TYPE user_type              AS ENUM ('org_user', 'yorkstn_staff', 'partner');
CREATE TYPE membership_role        AS ENUM ('owner', 'admin', 'compliance_manager', 'analyst_editor', 'viewer');
CREATE TYPE membership_status      AS ENUM ('active', 'suspended');
CREATE TYPE invitation_status      AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE subscription_tier      AS ENUM ('starter', 'growth', 'scale');
CREATE TYPE billing_status         AS ENUM ('trialing', 'active', 'past_due', 'canceled');
CREATE TYPE price_tier             AS ENUM ('mass', 'mid', 'premium', 'luxury');
CREATE TYPE operating_model        AS ENUM ('retail', 'wholesale', 'ecommerce', 'manufacturing');
CREATE TYPE ai_insight_category    AS ENUM ('market_analysis', 'consumer_insights', 'competitor_intelligence', 'pricing_intelligence', 'demand_forecast', 'city_recommendation');
CREATE TYPE confidence_level       AS ENUM ('high', 'medium', 'low', 'insufficient_data');
CREATE TYPE workflow_type          AS ENUM ('entity_formation', 'import_compliance', 'gst', 'bis', 'trademark_ip');
CREATE TYPE case_status            AS ENUM ('not_started', 'in_progress', 'blocked', 'completed');
CREATE TYPE workflow_item_status   AS ENUM ('pending', 'in_progress', 'blocked', 'completed', 'not_applicable');
CREATE TYPE entity_type_rec        AS ENUM ('wos', 'jv', 'llp', 'branch', 'liaison', 'project_office');
CREATE TYPE document_type          AS ENUM ('certificate', 'filing', 'poa', 'correspondence', 'verification_document', 'other');
CREATE TYPE attached_to_type       AS ENUM ('compliance_workflow_item', 'partner', 'brand_profile', 'managed_service_engagement');
CREATE TYPE partner_category       AS ENUM ('manufacturer', 'franchise', 'retail_distributor', 'mall_operator', 'cre', 'logistics', 'warehousing', 'marketing_agency', 'legal');
CREATE TYPE partner_verif_status   AS ENUM ('unverified', 'pending', 'verified');       -- public-facing status on partners.verification_status
CREATE TYPE verif_review_status    AS ENUM ('pending', 'approved', 'rejected');          -- internal review-record status on partner_verifications.status
CREATE TYPE introduction_status    AS ENUM ('sent', 'partner_viewed', 'accepted', 'declined');
CREATE TYPE site_status            AS ENUM ('candidate', 'shortlisted', 'rejected', 'selected');
CREATE TYPE milestone_type         AS ENUM ('entity_formation', 'compliance', 'partner_selection', 'site_selection', 'launch', 'custom');
CREATE TYPE milestone_status       AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');
CREATE TYPE line_item_source_type  AS ENUM ('user_input', 'platform_benchmark');
CREATE TYPE launch_task_status     AS ENUM ('todo', 'in_progress', 'done', 'blocked');
CREATE TYPE engagement_status      AS ENUM ('requested', 'scoping', 'in_progress', 'delivered', 'cancelled');
CREATE TYPE notification_type      AS ENUM ('compliance_deadline', 'partner_recommendation', 'managed_service_update', 'introduction_status_change', 'staleness_alert', 'invitation', 'system');
CREATE TYPE city_tier              AS ENUM ('tier1', 'tier2', 'tier3');
```

### 0.2 RBAC modeling decision — enum-based, not a normalized Role/Permission graph

**[Design decision]** `memberships.role` is a fixed Postgres enum (`membership_role`), not a normalized `roles` / `permissions` / `role_permissions` join graph. Rationale:
- The IA and personas define a **fixed, product-wide set of org-scoped roles** (Owner, Admin, Compliance Manager, Analyst/Editor, Viewer) — orgs do not define custom roles or toggle individual permissions in MVP. A normalized permission graph solves a problem (tenant-customizable RBAC) Yorkstn doesn't have yet.
- The permission → role mapping (the full matrix in `AUTH_RBAC.md`) is enforced in application code (a single authorization helper consulted on every API route), not re-derived from a DB join on every request — cheaper and easier to unit-test deterministically, which matters given RBAC is explicitly acceptance-criteria-tested (US-60/61).
- **Migration path if this changes post-MVP:** replace `memberships.role` (enum) with `memberships.role_id` (FK to a new `roles` table) and add `role_permissions`; the rest of the schema is unaffected since every authorization check already goes through one helper, not raw column reads scattered through the codebase.
- **Owner vs. Admin split:** the IA table header shows a single "Owner/Admin" column, but `owner` and `admin` are kept as two distinct enum values — `owner` is the org's original creator / billing-authority seat (exactly one per org, enforced in application logic, not a DB constraint, to keep ownership-transfer simple), `admin` has identical functional permissions to `owner` except billing/org-deletion/ownership-transfer. This matches real-world SaaS convention and Daniel's persona ("Organization Owner (all-modules)").
- **Yorkstn Staff and Partner are deliberately *not* membership roles.** Per the IA, Yorkstn Staff has "cross-organization visibility scoped by assignment" (not membership in any one org) and Partner is explicitly "not an Organization member." Both are modeled as a `users.user_type` discriminator plus their own linking tables (`staff_org_assignments`, `partners.contact_user_id`) — see §1.1 and §1.6.

---

## 1. Section 1 — Relational Schema

### 1.1 Identity & Tenancy

#### `organizations`
Multi-tenant root — every brand/holding-company account. One organization per legal brand entity being tracked (a holding company with multiple brands = multiple organizations, joined by shared user memberships, per the IA's org-switcher note).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | not null | |
| slug | text | unique, not null | URL-safe identifier, used in future subdomain routing |
| home_country | text | not null | ISO country name/code of HQ |
| subscription_tier | subscription_tier | not null, default `'starter'` | Drives module access per PRD §9 |
| billing_status | billing_status | not null, default `'trialing'` | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete — see §"Soft vs. Hard Delete" |

**Indexes:** unique on `slug`; index on `deleted_at` (partial, `WHERE deleted_at IS NULL`, to speed up "active orgs" scans).

#### `users`
Single identity table for all three user types (org users, Yorkstn staff, partner-portal users) — one login system, discriminated by `user_type`. **[Design decision]** unifying rather than splitting into `org_users`/`staff_users`/`partner_users` keeps auth (NextAuth/Auth.js) simple — one adapter, one session shape — while `user_type` plus the join tables below still fully separate what data each type can reach (see `AUTH_RBAC.md`).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| email | citext | unique, not null | Case-insensitive |
| password_hash | text | nullable | Null if the user only ever authenticates via OAuth |
| name | text | not null | |
| user_type | user_type | not null | `org_user` \| `yorkstn_staff` \| `partner` — immutable after creation |
| partner_id | uuid | nullable, unique, references partners(id) | Set only when `user_type = 'partner'`; enforces 1:1 partner-business↔login for MVP (**[Design decision]** multi-user partner accounts are a plausible post-MVP extension, not needed for MVP's single-contact partner persona) |
| email_verified_at | timestamptz | nullable | |
| image_url | text | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete — preserves audit-log actor references and historical membership/invitation rows |

**Indexes:** unique on `email`; unique on `partner_id` (partial, `WHERE partner_id IS NOT NULL`); index on `user_type`.
**Check constraint:** `partner_id IS NOT NULL ⇒ user_type = 'partner'` (app-enforced or a Postgres CHECK with a small function — either is acceptable; documented here as a required invariant).

#### `accounts`, `sessions`, `verification_tokens` — Auth.js/NextAuth standard tables
Required by the NextAuth.js Prisma adapter if OAuth and/or database-session strategy is used. Included here for completeness even though credentials-only + JWT sessions (the recommended strategy, see `AUTH_RBAC.md`) can run without `sessions`. Schema follows the Auth.js Prisma adapter's documented shape exactly — not reproduced column-by-column here to avoid drift from the library's own spec; see Section 2 for the literal Prisma models.

#### `memberships`
User↔Organization↔Role join. A user can belong to multiple organizations (multi-brand holding company, or a compliance lead contracted across brands) with a different role in each.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | not null, references users(id) | Must have `user_type = 'org_user'` (app-enforced invariant — staff and partners never get a membership row) |
| organization_id | uuid | not null, references organizations(id) | |
| role | membership_role | not null | `owner` \| `admin` \| `compliance_manager` \| `analyst_editor` \| `viewer` |
| status | membership_status | not null, default `'active'` | Suspend access without deleting history |
| invited_by_user_id | uuid | nullable, references users(id) | |
| joined_at | timestamptz | not null, default now() | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** unique on `(user_id, organization_id)`; index on `organization_id` (member-list queries); index on `user_id` (org-switcher queries).

#### `invitations`
Pending/accepted invites to join an organization with a pre-selected role (US-02).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| email | citext | not null | |
| role | membership_role | not null | Role the invitee will receive on acceptance |
| invited_by_user_id | uuid | not null, references users(id) | |
| token | text | unique, not null | Opaque, high-entropy; used in `/invite/:token` |
| status | invitation_status | not null, default `'pending'` | |
| expires_at | timestamptz | not null | |
| accepted_at | timestamptz | nullable | |
| created_at | timestamptz | not null, default now() | |

**Indexes:** unique on `token`; index on `(organization_id, email)`; index on `(status, expires_at)` for the expiry sweep job.

#### `staff_org_assignments`
Models Yorkstn Staff's cross-org-but-assignment-scoped access (US-28, persona 5). A staff user sees only the orgs they're assigned to, never all orgs by default.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| staff_user_id | uuid | not null, references users(id) | Must have `user_type = 'yorkstn_staff'` (app-enforced) |
| organization_id | uuid | not null, references organizations(id) | |
| assigned_by_user_id | uuid | nullable, references users(id) | Internal Yorkstn admin who made the assignment |
| assigned_at | timestamptz | not null, default now() | |
| revoked_at | timestamptz | nullable | Assignment history is kept, not deleted, for audit purposes |

**Indexes:** unique on `(staff_user_id, organization_id)`; index on `organization_id` (used when checking "which staff can see this org").

---

### 1.2 Brand & Products

#### `brand_profiles`
Created during onboarding (US-01); drives every AI Market Intelligence input.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | unique, not null, references organizations(id) | One profile per org for MVP — **[Design decision]** a holding company with multiple brands models each brand as its own Organization, not multiple brand profiles under one org, keeping every downstream module (compliance, partners, expansion) cleanly single-brand-scoped |
| category | text | not null | e.g., "kids apparel" |
| sub_category | text | nullable | |
| price_tier | price_tier | not null | |
| home_country | text | not null | |
| operating_model | operating_model | nullable | Feeds the Entity Formation questionnaire (US-20) |
| target_consumer_notes | text | nullable | Free text |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** unique on `organization_id`.

#### `products`
Lightweight product-line registry so HSN codes and category attributes can be reused across Import Compliance, BIS, and Pricing Intelligence rather than re-entered per workflow. **[Design decision]** not explicitly named in the source docs but implied by "Product HSN code(s)" appearing as an input in three separate features (2.2, 2.4, 1.4) — normalizing avoids duplicate/inconsistent HSN entry.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| name | text | not null | |
| hsn_code | text | nullable | May be unset until the user researches it |
| category | text | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `organization_id`; index on `hsn_code`.

---

### 1.3 AI Market Intelligence

#### `ai_insights`
Single category-discriminated table for market analysis, consumer insights, competitor intelligence, pricing intelligence, demand forecasting, and city recommendations — every one of these is generated the same shape per the AI Output Standard, differing only in `category` and the contents of `structured_output`. **[Design decision]** one polymorphic table (over five near-identical tables) because the AI Output Standard envelope (`summary`, `confidence`, `sources[]`, `assumptions[]`, `generatedAt`, `modelVersion`) is identical across categories and the category-specific payload is naturally heterogeneous JSON anyway (a ranked city list looks nothing like a price range) — forcing five separate strongly-typed tables would not buy meaningfully more type safety and would complicate the "one feed of AI outputs" queries the Expansion Dashboard needs.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| category | ai_insight_category | not null | Discriminator |
| city_id | uuid | nullable, references cities(id) | Set for consumer-insights (region-scoped) and city-recommendation rows |
| input_params | jsonb | not null | Snapshot of the brand-profile/weighting inputs used, for reproducibility and re-generation diffing |
| summary | text | not null | AI Output Standard: `summary` |
| confidence | confidence_level | not null | AI Output Standard: `confidence` |
| structured_output | jsonb | not null | Category-specific payload (e.g., competitor list, price range, forecast range, per-criterion city scores) |
| assumptions | text[] | not null, default `'{}'` | AI Output Standard: `assumptions[]` |
| methodology_note | text | nullable | e.g., demand-forecast's required `"proxy-based (no first-party sales history)"` label (US-14) |
| generated_at | timestamptz | not null | AI Output Standard: `generatedAt` |
| model_version | text | not null | AI Output Standard: `modelVersion` |
| requested_by_user_id | uuid | nullable, references users(id) | Null if system/scheduled regeneration |
| created_at | timestamptz | not null, default now() | |

**Indexes:** index on `(organization_id, category, generated_at DESC)` (latest-per-category lookups, the dominant query pattern); index on `city_id`.
**Retention:** append-only — regenerating an insight inserts a new row rather than overwriting, preserving history for "what did we tell this brand and when" audits.

#### `ai_insight_sources`
Normalizes the AI Output Standard's `sources[]` citation objects (title/url/retrieved-date) into queryable rows rather than an opaque JSON array, so citation coverage/staleness can be reported on directly.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| ai_insight_id | uuid | not null, references ai_insights(id) on delete cascade | |
| title | text | not null | |
| url | text | nullable | Null permitted for non-URL sources (e.g., an internal curated dataset citation) |
| retrieved_date | date | not null | |

**Indexes:** index on `ai_insight_id`.

#### `expansion_readiness_scores`
Composite 0–100 score (US-16). Deterministic/rules-based, **not** LLM output — kept structurally separate from `ai_insights` for exactly that reason (it must never be confused with a generative output in the schema).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| score | integer | not null, check (score between 0 and 100) | |
| inputs_snapshot | jsonb | not null | Raw inputs (compliance completion %, market-review flags, capital questionnaire answers) the score was computed from — required for the "same inputs → same score" reproducibility test in AC US-16 |
| rule_engine_version | text | not null | Scoring-function version, for auditability as rules evolve |
| calculated_at | timestamptz | not null, default now() | |

**Indexes:** index on `(organization_id, calculated_at DESC)` — the dashboard always wants the latest score; history is kept (append-only, like `ai_insights`) rather than updated in place, so score trend-over-time is queryable for free.

#### `readiness_score_drivers`
Per-driver breakdown that must sum to the total score (AC US-16).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| readiness_score_id | uuid | not null, references expansion_readiness_scores(id) on delete cascade | |
| driver_name | text | not null | e.g., `"compliance"`, `"market_clarity"`, `"capital_readiness"` |
| points_earned | numeric(5,2) | not null | |
| points_possible | numeric(5,2) | not null | |

**Indexes:** index on `readiness_score_id`.

---

### 1.4 Compliance Operating System

#### `compliance_cases`
One case per workflow type per organization — the parent grouping for Entity Formation, Import Compliance, GST, BIS, and Trademark/IP (PRD §5.2). **[Design decision]** unique `(organization_id, workflow_type)` — MVP assumes one active case per workflow per brand; a brand needing two parallel entity-formation tracks (e.g., WOS + a separate JV) is an edge case deferred post-MVP, at which point the uniqueness constraint would be relaxed and a `label` column added.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| workflow_type | workflow_type | not null | Discriminator |
| status | case_status | not null, default `'not_started'` | |
| recommended_entity_type | entity_type_rec | nullable | Populated only when `workflow_type = 'entity_formation'` (US-20) |
| entity_rationale | text | nullable | Rationale string referencing which questionnaire answers drove the recommendation (AC US-20) |
| questionnaire_answers | jsonb | nullable | Raw answers, needed to prove the rules-engine result is reproducible |
| rule_engine_version | text | nullable | Entity-recommendation rules-engine version (deterministic, not model-generated per AC US-20) |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete — compliance history must survive accidental removal |

**Indexes:** unique on `(organization_id, workflow_type)`; index on `organization_id`.

#### `compliance_workflow_items`
The individual checklist/task rows inside a case — IEC status, a GST-per-state registration, a BIS certification per product line, a trademark milestone, etc. **[Design decision]** kept as one table with a nullable `metadata jsonb` + a few promoted columns (`hsn_code`, `gst_state`, `product_id`) rather than five per-type tables, since the common columns (status, due date, "last verified" citation, assignee) dominate and the type-specific attributes are few and simple enough not to need their own relational structure.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| compliance_case_id | uuid | not null, references compliance_cases(id) | |
| organization_id | uuid | not null, references organizations(id) | Denormalized from the parent case for direct tenant-scoped queries/RLS without a join |
| title | text | not null | |
| description | text | nullable | |
| status | workflow_item_status | not null, default `'pending'` | |
| due_date | date | nullable | |
| assigned_to_user_id | uuid | nullable, references users(id) | |
| sequence_order | integer | not null, default 0 | |
| product_id | uuid | nullable, references products(id) | Set for import/BIS items scoped to a product line |
| hsn_code | text | nullable | Denormalized copy for items created before a formal `products` row exists |
| gst_state | text | nullable | Set only for `workflow_type = 'gst'` items on the parent case |
| metadata | jsonb | not null, default `'{}'` | Type-specific extras (e.g., trademark `mark_name`/`trademark_class`/`jurisdiction`, BIS `qco_reference`) |
| last_verified_at | date | nullable | The IA's "last verified" content convention |
| source_title | text | nullable | Citation title for the rule/checklist item |
| source_url | text | nullable | Citation URL |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete |

**Indexes:** index on `compliance_case_id`; index on `(organization_id, due_date)` (powers the cross-workflow timeline sort in US-26); index on `(organization_id, status)`; **partial unique index** on `(compliance_case_id, gst_state) WHERE gst_state IS NOT NULL` (prevents duplicate per-state GST tracking rows).
**Staleness:** the "staleness threshold" (e.g., 180 days, AC US-26/27) is a **configurable application constant**, not a per-row column — `is_stale` is computed at read time from `last_verified_at`, so changing the threshold doesn't require a backfill.

#### `documents`
Versioned attachment, polymorphically linkable to a compliance workflow item, a partner (verification documents), a brand profile, or a managed-service engagement deliverable (US-25).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| attached_to_type | attached_to_type | not null | Discriminator |
| attached_to_id | uuid | not null | Polymorphic FK — no DB-level referential integrity across the four possible parent tables; enforced in the application layer (**[Design decision]** standard trade-off of polymorphic association in a relational DB) |
| document_type | document_type | not null | |
| title | text | not null | |
| created_by_user_id | uuid | not null, references users(id) | |
| created_at | timestamptz | not null, default now() | |
| deleted_at | timestamptz | nullable | Soft delete of the document *record*; versions themselves are never deleted (see below) |

**Indexes:** index on `(attached_to_type, attached_to_id)`; index on `organization_id`.

#### `document_versions`
Append-only version history — "previous versions remain retrievable, not overwritten" (AC US-25).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| document_id | uuid | not null, references documents(id) | |
| version_number | integer | not null | |
| storage_key | text | not null | Object-storage key/path (e.g., S3-compatible key) |
| file_name | text | not null | |
| mime_type | text | not null | |
| size_bytes | bigint | not null | |
| checksum | text | nullable | Integrity hash |
| uploaded_by_user_id | uuid | not null, references users(id) | |
| uploaded_at | timestamptz | not null, default now() | |

**Indexes:** unique on `(document_id, version_number)`; index on `document_id`.
**Retention:** hard delete never applies here — this table is append-only by design; there is no `deleted_at`.

---

### 1.5 Partner Discovery Platform

#### `partners`
The business profile (manufacturer, distributor, mall operator, etc. — 9 categories per PRD §5.3).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| category | partner_category | not null | |
| business_name | text | not null | |
| description | text | nullable | |
| capacity_attributes | jsonb | not null, default `'{}'` | e.g., MOQ for manufacturers, warehouse sq. ft. |
| contact_user_id | uuid | nullable, unique, references users(id) | The partner-portal login for this business (see `users.partner_id`, the inverse FK) |
| verification_status | partner_verif_status | not null, default `'unverified'` | Denormalized "current" status for fast list-filtering (US-30); source of truth is the latest row in `partner_verifications` |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |
| deleted_at | timestamptz | nullable | Soft delete — preserves history for `introduction_requests` that reference an unlisted partner |

**Indexes:** index on `category`; index on `verification_status`; index on `(category, verification_status)` (the exact US-30 filter combination).
**Note:** this table is **not** tenant-scoped — partners are a shared, platform-wide directory visible across organizations (subject to verification-status filtering), not owned by one org.

#### `partner_cities`
Cities a partner serves — join table backing the city filter in search (US-30).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| partner_id | uuid | not null, references partners(id) | |
| city_id | uuid | not null, references cities(id) | |

**Indexes:** composite PK `(partner_id, city_id)`; index on `city_id` (reverse lookup: "which partners serve Mumbai").

#### `partner_references`
Reference contacts on a partner's profile (feature spec 3.2).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| partner_id | uuid | not null, references partners(id) | |
| reference_name | text | not null | |
| reference_contact | text | nullable | |
| note | text | nullable | |
| created_at | timestamptz | not null, default now() | |

**Indexes:** index on `partner_id`.

#### `partner_verifications`
History of verification review submissions/decisions (US-34/35) — distinct from `partners.verification_status`, which only ever shows `unverified`/`pending`/`verified` to brands. A `rejected` decision here reverts the partner's public status to `unverified` and the rejection reason stays visible **only** to the partner (never surfaced to brand-side queries — enforced at the API/query layer, see `AUTH_RBAC.md`).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| partner_id | uuid | not null, references partners(id) | |
| status | verif_review_status | not null, default `'pending'` | `pending` \| `approved` \| `rejected` |
| submitted_at | timestamptz | not null, default now() | |
| reviewed_by_user_id | uuid | nullable, references users(id) | Yorkstn Staff reviewer |
| reviewed_at | timestamptz | nullable | |
| rejection_reason | text | nullable | Partner-visible only |

**Indexes:** index on `partner_id`; index on `status` (powers the Yorkstn Staff verification queue, US-35).

#### `introduction_requests`
Brand → Partner outreach with a visible-to-both-sides status (US-33).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | Requesting org |
| partner_id | uuid | not null, references partners(id) | |
| requested_by_user_id | uuid | not null, references users(id) | |
| context | text | nullable | Free-text context the brand-side user provides |
| status | introduction_status | not null, default `'sent'` | |
| responded_at | timestamptz | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `organization_id`; index on `partner_id`; index on `status`.

---

### 1.6 Retail Expansion Intelligence

#### `cities`
Reference/content table — not tenant-scoped, shared market-intelligence data.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | not null | |
| state | text | not null | |
| tier | city_tier | nullable | |
| population | bigint | nullable | |
| demographics | jsonb | not null, default `'{}'` | |
| real_estate_cost_benchmark | jsonb | not null, default `'{}'` | Range, not point estimate |
| distribution_maturity | jsonb | not null, default `'{}'` | GT/MT/quick-commerce presence indicators |
| last_verified_at | date | nullable | **[Design decision]** extends the IA's compliance "last verified" convention to curated city content too, since this is equally externally-sourced and time-sensitive data |
| source_url | text | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** unique on `(name, state)`; index on `state`; index on `tier`.

#### `malls`
Mall-level detail within a city (US-41).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| city_id | uuid | not null, references cities(id) | |
| name | text | not null | |
| tenant_mix | jsonb | not null, default `'{}'` | |
| lease_benchmark | jsonb | not null, default `'{}'` | MG (minimum guarantee) + revenue-share convention, per research §12 |
| footfall_proxy_indicator | text | nullable | Explicitly labeled directional, not census data, per feature spec 4.2 |
| last_verified_at | date | nullable | |
| source_url | text | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `city_id`.

#### `sites`
Candidate sites in the site-selection workspace (US-42), tenant-scoped.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| city_id | uuid | not null, references cities(id) | |
| mall_id | uuid | nullable, references malls(id) | Null for a standalone high-street/commercial site not inside a mall |
| cre_partner_id | uuid | nullable, references partners(id) | Optional link if sourced via Partner Discovery's CRE category |
| name | text | not null | |
| address | text | nullable | |
| attributes | jsonb | not null, default `'{}'` | Size, asking rent, etc. |
| status | site_status | not null, default `'candidate'` | |
| computed_score | numeric(5,2) | nullable | |
| score_breakdown | jsonb | nullable | Per-criterion contribution, for reproducibility (AC US-42) |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `organization_id`; index on `(organization_id, status)`; index on `city_id`.

#### `site_scoring_configs`
The user-defined scoring weights referenced in AC US-42 ("reproducible from the same weights/inputs"). One active config per org. **[Design decision]** kept as its own small table (rather than a column on `sites`) since weights apply to the whole shortlist, not one site, and must be preserved even if all sites are later removed/re-scored.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | unique, not null, references organizations(id) | |
| weights | jsonb | not null | e.g., `{"footfall": 0.3, "rent": 0.3, "competitive_density": 0.2, "distribution_maturity": 0.2}` |
| updated_at | timestamptz | not null | |

**Indexes:** unique on `organization_id`.

#### `expansion_roadmaps`
One active sequenced plan per org (US-43). **[Design decision]** one roadmap per org for MVP — mirrors the `brand_profiles`/`site_scoring_configs` single-active-config pattern; multiple parallel roadmaps (e.g., phased multi-city launches modeled as separate plans) are a plausible post-MVP extension.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | unique, not null, references organizations(id) | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** unique on `organization_id`.

#### `roadmap_milestones`
Sequenced, dependency-aware steps within a roadmap.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| roadmap_id | uuid | not null, references expansion_roadmaps(id) | |
| organization_id | uuid | not null, references organizations(id) | Denormalized for direct tenant-scoped queries |
| milestone_type | milestone_type | not null | |
| title | text | not null | |
| status | milestone_status | not null, default `'not_started'` | |
| sequence_order | integer | not null | |
| depends_on_milestone_id | uuid | nullable, references roadmap_milestones(id) | Self-referential — encodes "dependency-aware" (PRD §5.4) |
| due_date | date | nullable | |
| linked_entity_type | text | nullable | Free-text pointer type, e.g., `'compliance_case'`, `'site'` — informational cross-link, not FK-enforced |
| linked_entity_id | uuid | nullable | Polymorphic, application-enforced (same trade-off as `documents.attached_to_id`) |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `(roadmap_id, sequence_order)`; index on `organization_id`.

#### `financial_projections`
Modeling workspace, explicitly labeled a tool the user owns, not a guaranteed forecast (US-44).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| name | text | not null | |
| horizon_months | integer | not null | |
| created_by_user_id | uuid | not null, references users(id) | |
| computed_output | jsonb | not null, default `'{}'` | Derived revenue/cost/margin series |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `organization_id`.

#### `financial_projection_line_items`
Normalized line items so user-entered assumptions and platform benchmarks are **structurally** distinguished, never merged into one opaque number (AC US-44 requires them to be visually distinguished in the UI — this table is what makes that possible at the data layer).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| financial_projection_id | uuid | not null, references financial_projections(id) | |
| source_type | line_item_source_type | not null | `user_input` \| `platform_benchmark` |
| line_item | text | not null | e.g., `"rent"`, `"staffing"`, `"cogs"`, `"marketing_spend"` |
| period | text | not null | e.g., `"2027-Q1"` |
| amount | numeric(14,2) | not null | |
| currency | char(3) | not null, default `'INR'` | |

**Indexes:** index on `financial_projection_id`; index on `(financial_projection_id, source_type)`.

#### `launch_tasks`
Go-live execution tracking, linkable to roadmap milestones (US-45).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| roadmap_milestone_id | uuid | nullable, references roadmap_milestones(id) | |
| title | text | not null | |
| description | text | nullable | |
| assigned_to_user_id | uuid | nullable, references users(id) | |
| due_date | date | nullable | |
| status | launch_task_status | not null, default `'todo'` | |
| sequence_order | integer | not null, default 0 | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `(organization_id, due_date)`; index on `roadmap_milestone_id`.

---

### 1.7 Managed Services (cross-cutting)

#### `managed_service_engagements`
A requested/tracked paid engagement (M.1/M.2, US-50/51).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | not null, references organizations(id) | |
| requested_by_user_id | uuid | not null, references users(id) | |
| linked_compliance_workflow_item_id | uuid | nullable, references compliance_workflow_items(id) | Set when triggered from a Compliance OS workflow ("Get expert help with this"); null for a standalone request from `/managed-services` |
| scope | text | not null | |
| status | engagement_status | not null, default `'requested'` | |
| assigned_staff_user_id | uuid | nullable, references users(id) | Yorkstn Staff fulfilling the engagement |
| deliverable_url | text | nullable | |
| created_at | timestamptz | not null, default now() | |
| updated_at | timestamptz | not null | |

**Indexes:** index on `organization_id`; index on `assigned_staff_user_id`; index on `status`.

#### `managed_service_updates`
Status/notes history so the brand always sees progress inside the platform (AC US-50/51 — "without needing an external email/channel" implies more than one update over an engagement's life).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| engagement_id | uuid | not null, references managed_service_engagements(id) | |
| author_user_id | uuid | not null, references users(id) | |
| note | text | not null | |
| status_at_time | engagement_status | not null | Snapshot of status when the note was posted |
| created_at | timestamptz | not null, default now() | |

**Indexes:** index on `(engagement_id, created_at)`.

---

### 1.8 Cross-Cutting Platform Tables

#### `notifications`
Compliance deadlines, partner recommendations, managed-services updates, introduction status changes, staleness alerts, invitations.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| recipient_user_id | uuid | not null, references users(id) | Works for org users, staff, and partner users alike |
| organization_id | uuid | nullable, references organizations(id) | Null for platform-level (e.g., Yorkstn Staff assignment) notifications |
| type | notification_type | not null | |
| payload | jsonb | not null, default `'{}'` | Type-specific data (e.g., entity id/type to deep-link to) |
| is_read | boolean | not null, default false | |
| read_at | timestamptz | nullable | |
| created_at | timestamptz | not null, default now() | |

**Indexes:** index on `(recipient_user_id, is_read, created_at DESC)` — the dominant "unread notifications for me" query.
**Retention:** hard delete acceptable (ephemeral; not a system-of-record) — **[Design decision]** unlike `audit_logs`, notifications carry no compliance/legal weight, so a retention/cleanup job purging read notifications after N months is fine.

#### `audit_logs`
Actor/action/entity/before-after trail for every create/update/delete on Compliance, Partner, and Document records (AC US-61), viewable at `/settings/audit-log`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organization_id | uuid | nullable, references organizations(id) | Nullable only for true platform-level actions (e.g., a Yorkstn Staff assignment change) not scoped to one org |
| actor_user_id | uuid | nullable, references users(id) | Nullable for system-initiated actions (e.g., an automated staleness recompute) |
| action | text | not null | Dotted event name, e.g., `"document.upload"`, `"compliance_workflow_item.status_change"` |
| entity_type | text | not null | |
| entity_id | uuid | not null | |
| before_state | jsonb | nullable | |
| after_state | jsonb | nullable | |
| ip_address | inet | nullable | |
| created_at | timestamptz | not null, default now() | |

**Indexes:** index on `(organization_id, created_at DESC)` (the audit-log page's default view); index on `(entity_type, entity_id)` (entity-level history lookups).
**Retention:** append-only, immutable, never deleted or updated in place — this is the one table where "hard delete" must never be an option at the application layer at all (only a possible time-boxed archival-to-cold-storage strategy, not deletion, if retention costs ever matter).

---

## 2. Section 2 — Prisma Schema (reference implementation)

This mirrors Section 1 exactly. `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums ----------

enum UserType {
  org_user
  yorkstn_staff
  partner
}

enum MembershipRole {
  owner
  admin
  compliance_manager
  analyst_editor
  viewer
}

enum MembershipStatus {
  active
  suspended
}

enum InvitationStatus {
  pending
  accepted
  expired
  revoked
}

enum SubscriptionTier {
  starter
  growth
  scale
}

enum BillingStatus {
  trialing
  active
  past_due
  canceled
}

enum PriceTier {
  mass
  mid
  premium
  luxury
}

enum OperatingModel {
  retail
  wholesale
  ecommerce
  manufacturing
}

enum AiInsightCategory {
  market_analysis
  consumer_insights
  competitor_intelligence
  pricing_intelligence
  demand_forecast
  city_recommendation
}

enum ConfidenceLevel {
  high
  medium
  low
  insufficient_data
}

enum WorkflowType {
  entity_formation
  import_compliance
  gst
  bis
  trademark_ip
}

enum CaseStatus {
  not_started
  in_progress
  blocked
  completed
}

enum WorkflowItemStatus {
  pending
  in_progress
  blocked
  completed
  not_applicable
}

enum EntityTypeRec {
  wos
  jv
  llp
  branch
  liaison
  project_office
}

enum DocumentType {
  certificate
  filing
  poa
  correspondence
  verification_document
  other
}

enum AttachedToType {
  compliance_workflow_item
  partner
  brand_profile
  managed_service_engagement
}

enum PartnerCategory {
  manufacturer
  franchise
  retail_distributor
  mall_operator
  cre
  logistics
  warehousing
  marketing_agency
  legal
}

enum PartnerVerifStatus {
  unverified
  pending
  verified
}

enum VerifReviewStatus {
  pending
  approved
  rejected
}

enum IntroductionStatus {
  sent
  partner_viewed
  accepted
  declined
}

enum SiteStatus {
  candidate
  shortlisted
  rejected
  selected
}

enum MilestoneType {
  entity_formation
  compliance
  partner_selection
  site_selection
  launch
  custom
}

enum MilestoneStatus {
  not_started
  in_progress
  completed
  blocked
}

enum LineItemSourceType {
  user_input
  platform_benchmark
}

enum LaunchTaskStatus {
  todo
  in_progress
  done
  blocked
}

enum EngagementStatus {
  requested
  scoping
  in_progress
  delivered
  cancelled
}

enum NotificationType {
  compliance_deadline
  partner_recommendation
  managed_service_update
  introduction_status_change
  staleness_alert
  invitation
  system
}

enum CityTier {
  tier1
  tier2
  tier3
}

// ---------- Identity & Tenancy ----------

model Organization {
  id                String            @id @default(uuid())
  name              String
  slug              String            @unique
  homeCountry       String            @map("home_country")
  subscriptionTier  SubscriptionTier  @default(starter) @map("subscription_tier")
  billingStatus     BillingStatus     @default(trialing) @map("billing_status")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  deletedAt         DateTime?         @map("deleted_at")

  memberships              Membership[]
  invitations              Invitation[]
  staffAssignments         StaffOrgAssignment[]
  brandProfile             BrandProfile?
  products                 Product[]
  aiInsights               AiInsight[]
  readinessScores          ExpansionReadinessScore[]
  complianceCases          ComplianceCase[]
  documents                Document[]
  introductionRequests     IntroductionRequest[]
  sites                    Site[]
  siteScoringConfig        SiteScoringConfig?
  roadmap                  ExpansionRoadmap?
  roadmapMilestones        RoadmapMilestone[]
  financialProjections     FinancialProjection[]
  launchTasks              LaunchTask[]
  managedServiceEngagements ManagedServiceEngagement[]
  notifications            Notification[]
  auditLogs                AuditLog[]

  @@map("organizations")
}

model User {
  id               String     @id @default(uuid())
  email            String     @unique
  passwordHash     String?    @map("password_hash")
  name             String
  userType         UserType   @map("user_type")
  partnerId        String?    @unique @map("partner_id")
  emailVerifiedAt  DateTime?  @map("email_verified_at")
  imageUrl         String?    @map("image_url")
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @updatedAt @map("updated_at")
  deletedAt        DateTime?  @map("deleted_at")

  partner                   Partner?  @relation("PartnerContact", fields: [partnerId], references: [id])
  accounts                  Account[]
  sessions                  Session[]
  memberships               Membership[]
  invitationsSent           Invitation[] @relation("InvitedBy")
  staffAssignments          StaffOrgAssignment[] @relation("StaffUser")
  assignedByAssignments     StaffOrgAssignment[] @relation("AssignedBy")
  aiInsightsRequested       AiInsight[]
  documentsCreated          Document[] @relation("DocumentCreatedBy")
  documentVersionsUploaded  DocumentVersion[]
  partnerVerificationsReviewed PartnerVerification[]
  introductionRequests      IntroductionRequest[]
  managedServiceEngagementsRequested ManagedServiceEngagement[] @relation("RequestedBy")
  managedServiceEngagementsAssigned  ManagedServiceEngagement[] @relation("AssignedStaff")
  managedServiceUpdates     ManagedServiceUpdate[]
  notifications             Notification[]
  auditLogs                 AuditLog[]
  financialProjectionsCreated FinancialProjection[]

  @@map("users")
}

// Auth.js (NextAuth) standard adapter models
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Membership {
  id               String            @id @default(uuid())
  userId           String            @map("user_id")
  organizationId   String            @map("organization_id")
  role             MembershipRole
  status           MembershipStatus  @default(active)
  invitedByUserId  String?           @map("invited_by_user_id")
  joinedAt         DateTime          @default(now()) @map("joined_at")
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("memberships")
}

model Invitation {
  id               String            @id @default(uuid())
  organizationId   String            @map("organization_id")
  email            String
  role             MembershipRole
  invitedByUserId  String            @map("invited_by_user_id")
  token            String            @unique
  status           InvitationStatus  @default(pending)
  expiresAt        DateTime          @map("expires_at")
  acceptedAt       DateTime?         @map("accepted_at")
  createdAt        DateTime          @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  invitedBy    User         @relation("InvitedBy", fields: [invitedByUserId], references: [id])

  @@index([organizationId, email])
  @@index([status, expiresAt])
  @@map("invitations")
}

model StaffOrgAssignment {
  id                String    @id @default(uuid())
  staffUserId       String    @map("staff_user_id")
  organizationId    String    @map("organization_id")
  assignedByUserId  String?   @map("assigned_by_user_id")
  assignedAt        DateTime  @default(now()) @map("assigned_at")
  revokedAt         DateTime? @map("revoked_at")

  staffUser    User         @relation("StaffUser", fields: [staffUserId], references: [id])
  assignedBy   User?        @relation("AssignedBy", fields: [assignedByUserId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])

  @@unique([staffUserId, organizationId])
  @@map("staff_org_assignments")
}

// ---------- Brand & Products ----------

model BrandProfile {
  id                    String          @id @default(uuid())
  organizationId        String          @unique @map("organization_id")
  category              String
  subCategory           String?         @map("sub_category")
  priceTier             PriceTier       @map("price_tier")
  homeCountry           String          @map("home_country")
  operatingModel        OperatingModel? @map("operating_model")
  targetConsumerNotes    String?        @map("target_consumer_notes")
  createdAt             DateTime       @default(now()) @map("created_at")
  updatedAt             DateTime       @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("brand_profiles")
}

model Product {
  id              String   @id @default(uuid())
  organizationId  String   @map("organization_id")
  name            String
  hsnCode         String?  @map("hsn_code")
  category        String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  organization           Organization              @relation(fields: [organizationId], references: [id])
  complianceWorkflowItems ComplianceWorkflowItem[]

  @@index([organizationId])
  @@index([hsnCode])
  @@map("products")
}

// ---------- AI Market Intelligence ----------

model AiInsight {
  id                 String            @id @default(uuid())
  organizationId     String            @map("organization_id")
  category           AiInsightCategory
  cityId             String?           @map("city_id")
  inputParams        Json              @map("input_params")
  summary            String
  confidence         ConfidenceLevel
  structuredOutput   Json              @map("structured_output")
  assumptions        String[]
  methodologyNote    String?           @map("methodology_note")
  generatedAt        DateTime          @map("generated_at")
  modelVersion       String            @map("model_version")
  requestedByUserId  String?           @map("requested_by_user_id")
  createdAt          DateTime          @default(now()) @map("created_at")

  organization Organization        @relation(fields: [organizationId], references: [id])
  city         City?               @relation(fields: [cityId], references: [id])
  requestedBy  User?               @relation(fields: [requestedByUserId], references: [id])
  sources      AiInsightSource[]

  @@index([organizationId, category, generatedAt])
  @@index([cityId])
  @@map("ai_insights")
}

model AiInsightSource {
  id             String   @id @default(uuid())
  aiInsightId    String   @map("ai_insight_id")
  title          String
  url            String?
  retrievedDate  DateTime @map("retrieved_date") @db.Date

  aiInsight AiInsight @relation(fields: [aiInsightId], references: [id], onDelete: Cascade)

  @@index([aiInsightId])
  @@map("ai_insight_sources")
}

model ExpansionReadinessScore {
  id                 String   @id @default(uuid())
  organizationId     String   @map("organization_id")
  score              Int
  inputsSnapshot     Json     @map("inputs_snapshot")
  ruleEngineVersion  String   @map("rule_engine_version")
  calculatedAt       DateTime @default(now()) @map("calculated_at")

  organization Organization             @relation(fields: [organizationId], references: [id])
  drivers      ReadinessScoreDriver[]

  @@index([organizationId, calculatedAt])
  @@map("expansion_readiness_scores")
}

model ReadinessScoreDriver {
  id                 String  @id @default(uuid())
  readinessScoreId   String  @map("readiness_score_id")
  driverName         String  @map("driver_name")
  pointsEarned       Decimal @map("points_earned") @db.Decimal(5, 2)
  pointsPossible     Decimal @map("points_possible") @db.Decimal(5, 2)

  readinessScore ExpansionReadinessScore @relation(fields: [readinessScoreId], references: [id], onDelete: Cascade)

  @@index([readinessScoreId])
  @@map("readiness_score_drivers")
}

// ---------- Compliance Operating System ----------

model ComplianceCase {
  id                     String        @id @default(uuid())
  organizationId         String        @map("organization_id")
  workflowType           WorkflowType  @map("workflow_type")
  status                 CaseStatus    @default(not_started)
  recommendedEntityType  EntityTypeRec? @map("recommended_entity_type")
  entityRationale        String?       @map("entity_rationale")
  questionnaireAnswers   Json?         @map("questionnaire_answers")
  ruleEngineVersion      String?       @map("rule_engine_version")
  createdAt              DateTime      @default(now()) @map("created_at")
  updatedAt              DateTime      @updatedAt @map("updated_at")
  deletedAt              DateTime?     @map("deleted_at")

  organization Organization              @relation(fields: [organizationId], references: [id])
  items        ComplianceWorkflowItem[]
  engagements  ManagedServiceEngagement[]

  @@unique([organizationId, workflowType])
  @@map("compliance_cases")
}

model ComplianceWorkflowItem {
  id                  String              @id @default(uuid())
  complianceCaseId    String              @map("compliance_case_id")
  organizationId      String              @map("organization_id")
  title               String
  description         String?
  status              WorkflowItemStatus  @default(pending)
  dueDate             DateTime?           @map("due_date") @db.Date
  assignedToUserId    String?             @map("assigned_to_user_id")
  sequenceOrder       Int                 @default(0) @map("sequence_order")
  productId           String?             @map("product_id")
  hsnCode             String?             @map("hsn_code")
  gstState            String?             @map("gst_state")
  metadata            Json                @default("{}")
  lastVerifiedAt      DateTime?           @map("last_verified_at") @db.Date
  sourceTitle         String?             @map("source_title")
  sourceUrl           String?             @map("source_url")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  deletedAt           DateTime?           @map("deleted_at")

  complianceCase ComplianceCase @relation(fields: [complianceCaseId], references: [id])
  product        Product?       @relation(fields: [productId], references: [id])
  documents      Document[]
  managedServiceEngagements ManagedServiceEngagement[]

  @@index([complianceCaseId])
  @@index([organizationId, dueDate])
  @@index([organizationId, status])
  @@map("compliance_workflow_items")
}

model Document {
  id                String          @id @default(uuid())
  organizationId    String          @map("organization_id")
  attachedToType    AttachedToType  @map("attached_to_type")
  attachedToId      String          @map("attached_to_id")
  documentType      DocumentType    @map("document_type")
  title             String
  createdByUserId   String          @map("created_by_user_id")
  createdAt         DateTime        @default(now()) @map("created_at")
  deletedAt         DateTime?       @map("deleted_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  createdBy    User         @relation("DocumentCreatedBy", fields: [createdByUserId], references: [id])
  versions     DocumentVersion[]
  complianceWorkflowItem ComplianceWorkflowItem? @relation(fields: [attachedToId], references: [id], map: "fk_document_compliance_item")

  @@index([attachedToType, attachedToId])
  @@index([organizationId])
  @@map("documents")
}

model DocumentVersion {
  id                 String   @id @default(uuid())
  documentId         String   @map("document_id")
  versionNumber      Int      @map("version_number")
  storageKey         String   @map("storage_key")
  fileName           String   @map("file_name")
  mimeType           String   @map("mime_type")
  sizeBytes          BigInt   @map("size_bytes")
  checksum           String?
  uploadedByUserId   String   @map("uploaded_by_user_id")
  uploadedAt         DateTime @default(now()) @map("uploaded_at")

  document   Document @relation(fields: [documentId], references: [id])
  uploadedBy User     @relation(fields: [uploadedByUserId], references: [id])

  @@unique([documentId, versionNumber])
  @@map("document_versions")
}

// ---------- Partner Discovery ----------

model Partner {
  id                  String              @id @default(uuid())
  category            PartnerCategory
  businessName        String              @map("business_name")
  description         String?
  capacityAttributes  Json                @default("{}") @map("capacity_attributes")
  verificationStatus  PartnerVerifStatus  @default(unverified) @map("verification_status")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")
  deletedAt           DateTime?           @map("deleted_at")

  contactUser           User?                  @relation("PartnerContact")
  cities                PartnerCity[]
  references            PartnerReference[]
  verifications         PartnerVerification[]
  introductionRequests   IntroductionRequest[]
  sites                  Site[]

  @@index([category])
  @@index([verificationStatus])
  @@map("partners")
}

model PartnerCity {
  partnerId String @map("partner_id")
  cityId    String @map("city_id")

  partner Partner @relation(fields: [partnerId], references: [id])
  city    City    @relation(fields: [cityId], references: [id])

  @@id([partnerId, cityId])
  @@index([cityId])
  @@map("partner_cities")
}

model PartnerReference {
  id                String   @id @default(uuid())
  partnerId         String   @map("partner_id")
  referenceName     String   @map("reference_name")
  referenceContact  String?  @map("reference_contact")
  note              String?
  createdAt         DateTime @default(now()) @map("created_at")

  partner Partner @relation(fields: [partnerId], references: [id])

  @@index([partnerId])
  @@map("partner_references")
}

model PartnerVerification {
  id                  String             @id @default(uuid())
  partnerId           String             @map("partner_id")
  status              VerifReviewStatus  @default(pending)
  submittedAt         DateTime           @default(now()) @map("submitted_at")
  reviewedByUserId    String?            @map("reviewed_by_user_id")
  reviewedAt          DateTime?          @map("reviewed_at")
  rejectionReason     String?            @map("rejection_reason")

  partner      Partner @relation(fields: [partnerId], references: [id])
  reviewedBy   User?   @relation(fields: [reviewedByUserId], references: [id])

  @@index([partnerId])
  @@index([status])
  @@map("partner_verifications")
}

model IntroductionRequest {
  id                 String              @id @default(uuid())
  organizationId     String              @map("organization_id")
  partnerId          String              @map("partner_id")
  requestedByUserId  String              @map("requested_by_user_id")
  context            String?
  status             IntroductionStatus  @default(sent)
  respondedAt        DateTime?           @map("responded_at")
  createdAt          DateTime            @default(now()) @map("created_at")
  updatedAt          DateTime            @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  partner      Partner      @relation(fields: [partnerId], references: [id])
  requestedBy  User         @relation(fields: [requestedByUserId], references: [id])

  @@index([organizationId])
  @@index([partnerId])
  @@index([status])
  @@map("introduction_requests")
}

// ---------- Retail Expansion Intelligence ----------

model City {
  id                        String    @id @default(uuid())
  name                      String
  state                     String
  tier                      CityTier?
  population                BigInt?
  demographics              Json      @default("{}")
  realEstateCostBenchmark   Json      @default("{}") @map("real_estate_cost_benchmark")
  distributionMaturity      Json      @default("{}") @map("distribution_maturity")
  lastVerifiedAt            DateTime? @map("last_verified_at") @db.Date
  sourceUrl                 String?   @map("source_url")
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  malls        Mall[]
  partners     PartnerCity[]
  sites        Site[]
  aiInsights   AiInsight[]

  @@unique([name, state])
  @@index([state])
  @@index([tier])
  @@map("cities")
}

model Mall {
  id                      String    @id @default(uuid())
  cityId                  String    @map("city_id")
  name                    String
  tenantMix               Json      @default("{}") @map("tenant_mix")
  leaseBenchmark          Json      @default("{}") @map("lease_benchmark")
  footfallProxyIndicator  String?   @map("footfall_proxy_indicator")
  lastVerifiedAt          DateTime? @map("last_verified_at") @db.Date
  sourceUrl               String?   @map("source_url")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")

  city  City   @relation(fields: [cityId], references: [id])
  sites Site[]

  @@index([cityId])
  @@map("malls")
}

model Site {
  id               String     @id @default(uuid())
  organizationId   String     @map("organization_id")
  cityId           String     @map("city_id")
  mallId           String?    @map("mall_id")
  crePartnerId     String?    @map("cre_partner_id")
  name             String
  address          String?
  attributes       Json       @default("{}")
  status           SiteStatus @default(candidate)
  computedScore    Decimal?   @map("computed_score") @db.Decimal(5, 2)
  scoreBreakdown   Json?      @map("score_breakdown")
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])
  city         City         @relation(fields: [cityId], references: [id])
  mall         Mall?        @relation(fields: [mallId], references: [id])
  crePartner   Partner?     @relation(fields: [crePartnerId], references: [id])

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([cityId])
  @@map("sites")
}

model SiteScoringConfig {
  id              String   @id @default(uuid())
  organizationId  String   @unique @map("organization_id")
  weights         Json
  updatedAt       DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id])

  @@map("site_scoring_configs")
}

model ExpansionRoadmap {
  id              String   @id @default(uuid())
  organizationId  String   @unique @map("organization_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  organization Organization        @relation(fields: [organizationId], references: [id])
  milestones   RoadmapMilestone[]

  @@map("expansion_roadmaps")
}

model RoadmapMilestone {
  id                     String           @id @default(uuid())
  roadmapId              String           @map("roadmap_id")
  organizationId         String           @map("organization_id")
  milestoneType          MilestoneType    @map("milestone_type")
  title                  String
  status                 MilestoneStatus  @default(not_started)
  sequenceOrder          Int              @map("sequence_order")
  dependsOnMilestoneId   String?          @map("depends_on_milestone_id")
  dueDate                DateTime?        @map("due_date") @db.Date
  linkedEntityType       String?          @map("linked_entity_type")
  linkedEntityId         String?          @map("linked_entity_id")
  createdAt              DateTime         @default(now()) @map("created_at")
  updatedAt              DateTime         @updatedAt @map("updated_at")

  roadmap       ExpansionRoadmap    @relation(fields: [roadmapId], references: [id])
  organization  Organization        @relation(fields: [organizationId], references: [id])
  dependsOn     RoadmapMilestone?   @relation("MilestoneDependency", fields: [dependsOnMilestoneId], references: [id])
  dependents    RoadmapMilestone[]  @relation("MilestoneDependency")
  launchTasks   LaunchTask[]

  @@index([roadmapId, sequenceOrder])
  @@index([organizationId])
  @@map("roadmap_milestones")
}

model FinancialProjection {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  name              String
  horizonMonths     Int      @map("horizon_months")
  createdByUserId   String   @map("created_by_user_id")
  computedOutput    Json     @default("{}") @map("computed_output")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  organization Organization                    @relation(fields: [organizationId], references: [id])
  createdBy    User                            @relation(fields: [createdByUserId], references: [id])
  lineItems    FinancialProjectionLineItem[]

  @@index([organizationId])
  @@map("financial_projections")
}

model FinancialProjectionLineItem {
  id                     String              @id @default(uuid())
  financialProjectionId  String              @map("financial_projection_id")
  sourceType             LineItemSourceType  @map("source_type")
  lineItem               String              @map("line_item")
  period                 String
  amount                 Decimal             @db.Decimal(14, 2)
  currency               String              @default("INR") @db.Char(3)

  financialProjection FinancialProjection @relation(fields: [financialProjectionId], references: [id])

  @@index([financialProjectionId])
  @@index([financialProjectionId, sourceType])
  @@map("financial_projection_line_items")
}

model LaunchTask {
  id                    String            @id @default(uuid())
  organizationId        String            @map("organization_id")
  roadmapMilestoneId    String?           @map("roadmap_milestone_id")
  title                 String
  description           String?
  assignedToUserId      String?           @map("assigned_to_user_id")
  dueDate               DateTime?         @map("due_date") @db.Date
  status                LaunchTaskStatus  @default(todo)
  sequenceOrder         Int               @default(0) @map("sequence_order")
  createdAt             DateTime          @default(now()) @map("created_at")
  updatedAt             DateTime          @updatedAt @map("updated_at")

  organization      Organization       @relation(fields: [organizationId], references: [id])
  roadmapMilestone  RoadmapMilestone?  @relation(fields: [roadmapMilestoneId], references: [id])

  @@index([organizationId, dueDate])
  @@index([roadmapMilestoneId])
  @@map("launch_tasks")
}

// ---------- Managed Services ----------

model ManagedServiceEngagement {
  id                                String            @id @default(uuid())
  organizationId                    String            @map("organization_id")
  requestedByUserId                 String            @map("requested_by_user_id")
  linkedComplianceWorkflowItemId    String?           @map("linked_compliance_workflow_item_id")
  scope                             String
  status                            EngagementStatus  @default(requested)
  assignedStaffUserId               String?           @map("assigned_staff_user_id")
  deliverableUrl                    String?           @map("deliverable_url")
  createdAt                         DateTime          @default(now()) @map("created_at")
  updatedAt                         DateTime          @updatedAt @map("updated_at")

  organization              Organization             @relation(fields: [organizationId], references: [id])
  requestedBy               User                     @relation("RequestedBy", fields: [requestedByUserId], references: [id])
  assignedStaff              User?                    @relation("AssignedStaff", fields: [assignedStaffUserId], references: [id])
  linkedComplianceItem        ComplianceWorkflowItem? @relation(fields: [linkedComplianceWorkflowItemId], references: [id])
  linkedComplianceCase        ComplianceCase?         @relation(fields: [linkedComplianceWorkflowItemId], references: [id], map: "fk_engagement_case")
  updates                    ManagedServiceUpdate[]

  @@index([organizationId])
  @@index([assignedStaffUserId])
  @@index([status])
  @@map("managed_service_engagements")
}

model ManagedServiceUpdate {
  id             String            @id @default(uuid())
  engagementId   String            @map("engagement_id")
  authorUserId   String            @map("author_user_id")
  note           String
  statusAtTime   EngagementStatus  @map("status_at_time")
  createdAt      DateTime          @default(now()) @map("created_at")

  engagement  ManagedServiceEngagement @relation(fields: [engagementId], references: [id])
  author      User                     @relation(fields: [authorUserId], references: [id])

  @@index([engagementId, createdAt])
  @@map("managed_service_updates")
}

// ---------- Cross-Cutting Platform ----------

model Notification {
  id                String            @id @default(uuid())
  recipientUserId   String            @map("recipient_user_id")
  organizationId    String?           @map("organization_id")
  type              NotificationType
  payload           Json              @default("{}")
  isRead            Boolean           @default(false) @map("is_read")
  readAt            DateTime?         @map("read_at")
  createdAt         DateTime          @default(now()) @map("created_at")

  recipient    User          @relation(fields: [recipientUserId], references: [id])
  organization Organization? @relation(fields: [organizationId], references: [id])

  @@index([recipientUserId, isRead, createdAt])
  @@map("notifications")
}

model AuditLog {
  id              String    @id @default(uuid())
  organizationId  String?   @map("organization_id")
  actorUserId     String?   @map("actor_user_id")
  action          String
  entityType      String    @map("entity_type")
  entityId        String    @map("entity_id")
  beforeState     Json?     @map("before_state")
  afterState      Json?     @map("after_state")
  ipAddress       String?   @map("ip_address")
  createdAt       DateTime  @default(now()) @map("created_at")

  organization Organization? @relation(fields: [organizationId], references: [id])
  actor        User?         @relation(fields: [actorUserId], references: [id])

  @@index([organizationId, createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

**Note on the Prisma listing above:** two relations on `ManagedServiceEngagement`/`Document` (`linkedComplianceCase`, `complianceWorkflowItem`) are shown to illustrate intent; a real migration would resolve the `Document.attachedToId` polymorphic association by dropping the FK-style relation attribute entirely (Prisma cannot natively express polymorphic associations) and enforcing it purely in application code, exactly as noted in Section 1's `documents` table. Treat those two lines as illustrative, not literally migratable as-is — this is called out explicitly rather than silently shipping a schema that would fail `prisma migrate`.

---

## 3. Indexing Strategy — Summary

Beyond the per-table indexes already listed above, three cross-cutting rules:

1. **Every tenant-scoped table gets an index on `organization_id`** (or inherits one via a unique/composite index that leads with it) — the fundamental multi-tenant access pattern is "give me this organization's X," so `organization_id` should almost always be the leading column in any composite index on that table.
2. **Every "list sorted/filtered by X" screen in the IA gets a composite index matching that exact query shape**, not just single-column indexes — e.g., `(organization_id, due_date)` on `compliance_workflow_items` and `launch_tasks` (powers the cross-workflow timeline and launch plan sorts), `(organization_id, category, generated_at DESC)` on `ai_insights` (powers "latest insight per category"), `(category, verification_status)` on `partners` (powers the exact US-30 filter combination).
3. **Foreign keys to high-cardinality lookup tables get their own index even when not tenant-scoped** — e.g., `partner_cities.city_id`, `ai_insight_sources.ai_insight_id`, `document_versions.document_id` — because Postgres does not automatically index the "many" side of a FK relationship.

---

## 4. Soft-Delete vs. Hard-Delete Policy

| Category | Policy | Tables | Rationale |
|---|---|---|---|
| **Soft delete** (`deleted_at`) | Row is flagged, excluded from default queries, retained indefinitely | `organizations`, `users`, `compliance_cases`, `compliance_workflow_items`, `documents`, `partners` | These are referenced by audit logs, historical introduction requests, or other tenants' records (partners), or are themselves the audit-relevant record (compliance). Hard-deleting would break referential/audit history or silently orphan FKs. |
| **Append-only, never deleted** | No delete path at all, only new rows | `document_versions`, `ai_insights`, `ai_insight_sources`, `expansion_readiness_scores`, `readiness_score_drivers`, `audit_logs`, `managed_service_updates` | Each of these is itself a history/version record — deleting one would defeat its purpose (version retrievability, score reproducibility, immutable audit trail). |
| **Hard delete acceptable** | Normal `DELETE`, no retention requirement | `notifications`, `invitations` (once expired/revoked, on a cleanup schedule), `sites` (a rejected candidate site the user removes), `partner_references` | Ephemeral or low-stakes UI state with no compliance/legal retention need. |

**[Design decision]** this is a three-tier policy, not a blanket "always soft-delete" rule, because uniformly soft-deleting everything (a common default) would bloat low-value tables like `notifications` for no auditability benefit, while hard-deleting anything audit-adjacent would directly violate AC US-61's audit-trail requirement.

---

## 5. Multi-Tenancy Enforcement

- **Schema-level:** every tenant-scoped table carries `organization_id` directly (denormalized onto child tables like `compliance_workflow_items` and `roadmap_milestones` even though it's derivable via a join to the parent), so that a single `WHERE organization_id = $1` clause is always sufficient — no query needs to join up two or three levels just to enforce tenant isolation.
- **Application-level (primary enforcement in MVP):** every Prisma query in the API layer is expected to go through a request-scoped data-access helper that injects `organization_id = session.currentOrgId` automatically, so no hand-written query can accidentally cross tenants. This is the same architectural pattern documented in `AUTH_RBAC.md`.
- **Database-level (recommended defense-in-depth, not required for MVP launch):** Postgres **Row-Level Security (RLS)** policies keyed on `organization_id`, set via `SET app.current_org_id = '...'` per connection/transaction. **[Design decision]** not mandated for MVP given the app-layer scoping helper above already satisfies AC US-60/61's enforcement requirement, and RLS adds operational complexity (every connection must set the session variable, migrations must account for it). Recommended as a hardening step once the platform holds real customer compliance/financial data, given the sensitivity of what this schema stores.
- **Non-tenant-scoped tables are the deliberate exception, not an oversight:** `users` (identity is cross-tenant by design — one login, many orgs via `memberships`), `partners`/`partner_cities`/`partner_references`/`partner_verifications` (a shared directory, not owned by one org — visibility is governed by `verification_status` + role, not tenant isolation), `cities`/`malls` (shared reference content), and the four Auth.js tables.
