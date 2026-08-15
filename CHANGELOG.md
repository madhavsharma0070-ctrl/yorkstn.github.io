# Changelog

All notable changes to the Yorkstn project (research, product/architecture design, and implementation) are recorded here, most recent first. This complements `git log` with phase-level context; it does not replace commit messages.

## Phase 4 — Implementation, Milestone 8: Managed Services + cross-cutting hardening (2026-07-31) — MVP complete

- Managed Services (US-50/51): brand-side request/tracking (`/app/managed-services`), a Yorkstn Staff triage queue (`/app/admin/managed-services`) where a platform admin assigns a staff member — the exact moment a `staff_org_assignments` row is created for that org (AUTH_RBAC.md §3) — and only the assigned staff member (or a platform admin) may post status/note updates, each appended to a separate `ManagedServiceUpdate` history table so the brand always sees the full timeline in-platform, never an off-platform channel. A "Get expert help" link on each Compliance workflow item prefills a request scoped to that task.
- Corrected the `ManagedServiceEngagement` schema to match `DATABASE_SCHEMA.md` before any real data existed (`requestedByUserId`, `assignedStaffUserId`, `deliverableUrl`, the separate `ManagedServiceUpdate` table) — D-30.
- `requireStaffSession()` now re-queries `isPlatformAdmin` fresh from the DB on every call (D-31), completing the check Milestone 1's own code comment had flagged as deferred to this milestone.
- **Full audit-log sweep (US-61):** a mechanical `grep`-based scan across every `route.ts` exporting a mutating HTTP verb found 16 routes with zero `writeAuditLog` calls — all 7 AI Market Intelligence generate/recalculate endpoints, 5 Retail Expansion Intelligence routes left over from Milestone 7, 3 partner-portal mutations, and signup. All 16 fixed; `session/active-organization` is the one legitimately-excluded route (no DB write at all). D-33.
- **Full RBAC re-verification:** cross-checked every `requirePermission` call across all API routes against `AUTH_RBAC.md`'s permission table by hand — found fully consistent, no drift. Added `managed_services:view` (previously only `:request` existed, leaving no explicit read permission for the "read-only" roles the table already specified) plus new RBAC unit tests.
- **Found and fixed a real gap that would have made the feature undemonstrable:** no seeded Yorkstn Staff user had `isPlatformAdmin: true`, so no managed-services engagement could ever be assigned in the seed environment. Seeded `ananya.staff@yorkstn.com` as the platform admin (D-32).
- **Added the CI workflow `DEPLOYMENT_ARCHITECTURE.md` had only described:** `.github/workflows/ci.yml` (lint/test/build) — the checklist already claimed CI was "deployable today with zero new credentials," but no workflow file existed in the repo. Reviewed the rest of the credentials/infra checklist against everything built through Milestone 8 and confirmed it's still accurate (D-34).
- Added an owner/admin-only Audit Log page (`/app/settings/audit-log`) — the `audit_log:view` permission and API route already existed from Milestone 1 but had no UI consuming them until now.
- Verified via build+lint+58 unit tests (1 new test file's worth of RBAC assertions) + an extensive live smoke test: RBAC matrix for managed-services request/view matches AUTH_RBAC.md exactly (viewer/analyst_editor 403 on request, 200 on view; compliance_manager 201 on request); platform-admin-only assignment enforced (a second, non-admin staff user got 403 assigning and 403 updating an engagement not assigned to them); assigned-staff updates immediately visible on the brand side; audit log correctly attributes every action (including staff actions on the org's behalf) and is 403'd for compliance_manager/analyst_editor; the "Get expert help" link round-trips a real compliance workflow item id into a created engagement; all new/backfilled audit-log entries confirmed present after exercising every previously-missing route.

## Phase 4 — Implementation, Milestone 7: Retail Expansion Intelligence (2026-07-29)

- City Intelligence (US-40) and Mall Intelligence (US-41): reference/content reads, not org-scoped (D-14) — every authenticated org sees the same curated city/mall data, including distribution-maturity and lease-benchmark detail pages linking city → mall.
- Site Selection (US-42): a pure, deterministic, unit-tested `computeSiteScore` (footfall/rent/competitive-density/distribution-maturity, user-adjustable weights, missing rent data conservatively treated as expensive) — never AI-generated (D-04, the third instance alongside the Readiness Score and City Recommendations). Changing scoring weights recomputes every site's score from scratch, verified live (an all-weight-on-footfall test produced exactly the footfall input value).
- Expansion Roadmap (US-43): 5 fixed milestones (`entity_formation`, `compliance`, `partner_selection`, `site_selection`, `launch`) whose status is synced from real Compliance/Partner/Site/LaunchTask state on every read (`milestone-auto-sync.ts`), never set manually.
- Financial Projections (US-44, AC US-44): `userAssumptions`/`platformBenchmarks` stored and returned as two structurally separate JSON fields, never blended into one number — verified live that a mixed-source line-item submission round-trips into the correct separate lists.
- Launch Tasks (US-45): simple create/list/status-update tracker, optionally linked to a roadmap milestone.
- Expansion Dashboard (US-46, AC US-46): the one service (`dashboard-aggregation.service.ts`) whose job is composing reads across all four modules — still done exclusively through each module's own exported functions (`getLatestReadinessScore`, `isContentStale`, `syncRoadmapMilestones`), never a raw cross-module join. The Milestone 1 placeholder dashboard now renders this real, composed data.
- Full UI: an Expansion overview (roadmap progress) plus Cities/city-detail/mall-detail, a Site Selection workspace (weight editor + candidate-site list with live status changes), a Financial Projections workspace, and a Launch Tasks tracker — following the established client-fetch-plus-`AppShell` pattern from Milestones 2/3/5/6.
- **Found and fixed three real bugs surfaced by live smoke testing, not by inspection:** (1) `app/api/v1/onboarding/organization/route.ts` never created the 5 `RoadmapMilestone` rows for a real (non-seeded) organization — only `prisma/seed.ts` did (D-27). (2) The sites/launch-tasks routes' `.uuid()` Zod constraints on `mallId`/`crePartnerId`/`roadmapMilestoneId` rejected legitimate references to seed data's human-readable ids (e.g. `seed-mall-mumbai-phoenix`) — relaxed to match the Partners module's existing convention (D-28). (3) `site_selection`'s roadmap status was binary (`completed`/`not_started` only), unlike the other four milestones' three-state (`not_started`/`in_progress`/`completed`) — a brand actively shortlisting sites saw a misleading blank step; added the missing `in_progress` state (D-29).
- Verified via build+lint+57 unit tests + an extensive live smoke test: city/mall detail pages render real seeded data with correct city↔mall linking; site creation against the seeded non-UUID mall id now succeeds; scoring-weight changes correctly recompute all sites' scores; site status updates persist; roadmap auto-sync correctly reflects real created-site and launch-task state after the D-29 fix; financial projections keep assumptions/benchmarks separate; the dashboard aggregation endpoint composes all four modules' real state; RBAC enforced (viewer: 403 on all `expansion:edit` actions, 200 on view); all new platform pages return 200 and render with correctly-generated `tw-` Tailwind CSS.

## Phase 4 — Implementation, Milestone 6: Partner Discovery Platform (2026-07-29)

- Partner directory search (US-30) and brand-facing profile read (US-31) — the latter an explicit allow-list, never a conditional field strip, so `rejectionReason` and internal verification history can never leak to a brand.
- AI Partner Recommendations (US-32): deterministic match scoring (city overlap with the org's own latest City Recommendation insight — a real cross-module read via `getLatestInsight`, plus verification status) merged with an AI narrative, mirroring City Recommendations' hybrid pattern. Required extending `ai_insight_category` with a `partner_recommendation` value that `DATABASE_SCHEMA.md` had omitted despite `FEATURE_SPECIFICATIONS.md`/`API_SPECIFICATION.md` both describing it (D-26).
- Introduction requests (US-33): fixed state machine (`sent -> partner_viewed -> accepted|declined`), unit-tested.
- Partner self-service profile + verification submission (US-34) and the Yorkstn Staff verification queue (US-35), in a fully separate partner-portal route group/root layout with its own auth context (`requirePartnerContext`) and a new `requireStaffSession` helper.
- **Found and fixed a real, previously-undetected bug:** `tailwind.config.js`'s content globs still pointed at the pre-D-23 paths (`app/app/**`, `app/partner-portal/**`), not the actual `app/(platform)/**` route-group structure — meaning Tailwind had likely generated ~zero utility CSS for every page built since Milestone 2 (functionally correct, visually unstyled). Confirmed via the built CSS file before/after (96 `tw-` rules present after the fix) and via curl showing the rendered HTML's classes now have matching CSS.
- Verified via build+lint+53 unit tests (7 new: introduction-request state machine, partner match scoring) + an extensive live smoke test: search returns only verified partners, introduction request sent and visible to both sides, partner submits for verification, staff rejects with a reason, partner sees the reason on their own profile, brand-side profile response has no `rejectionReason` key at all (confirmed by inspecting response keys directly), double-decision correctly rejected (409), and a partner session correctly denied brand-side API access with a clear error message (a small fix to `requireOrgContext` improved this from a confusing "complete onboarding" message).

## Phase 4 — Implementation, Milestone 5: AI Market Intelligence module (2026-07-27)

- Shared `generateAndSaveInsight`/`getLatestInsight` path consuming Milestone 4's AI service layer, used by 5 near-identical features (market analysis, consumer insights, competitor intelligence, pricing intelligence, demand forecast) instead of duplicating persistence logic five times.
- Pricing Intelligence reads Compliance's HSN duty/labelling signal through its exported `lookupHsnCompliance` function (cross-module read, never a raw Prisma query into another module's tables).
- Demand Forecast always labels its methodology `"proxy-based (no first-party sales history)"` (US-14).
- City Recommendations: a genuine hybrid — deterministic, unit-tested `scoreCities` (population tier + distribution maturity, user-adjustable weights) merged with an AI narrative; a city with no data is flagged `insufficient_data`, never given a fabricated score.
- Expansion Readiness Score: deterministic scoring engine (compliance completion % from real DB data, market-clarity flags from real generated insights, capital-readiness from caller input) — structurally separate from `ai_insights`, never AI-generated (DECISIONS.md D-04).
- API routes for all 6 features (GET latest + POST generate) plus readiness-score (GET + POST recalculate). UI: a consolidated Market Intelligence page with per-feature cards, confidence badges, source links, and a readiness-score panel.
- Verified via build+lint+46 unit tests (9 new: readiness-score determinism/driver-math, city-scoring determinism/ranking/insufficient-data) + live smoke test: market analysis generated with real, traceable sources; city recommendations correctly ranked Mumbai/Delhi (tier1, high maturity) above Pune (tier2); demand forecast correctly labeled; readiness score computed correctly (20/100 with 2-of-3 market-clarity signals, 0 compliance, 0 capital, matching hand-calculated expectation); RBAC enforced (viewer: 403 on generate/recalculate, 200 on view).

## Phase 4 — Implementation, Milestone 4: AI Service Layer (2026-07-27)

- Provider-agnostic `AiProvider` interface + the AI Output Standard types (`lib/modules/market-intelligence/ai-provider/types.ts`).
- `MockAiProvider` — the MVP default, deterministic, never claims high confidence, honestly returns `insufficient_data` when the curated corpus has no relevant entry rather than fabricating content.
- `ClaudeAiProvider` — a real, documented drop-in against the Messages API (grounded/RAG-constrained prompt, JSON-only response contract), selected via `AI_PROVIDER=anthropic`. **Not exercised in this environment** — no `ANTHROPIC_API_KEY` is available; must be verified against a real key before production use.
- Curated retrieval corpus (`retrieval/corpus.ts`) — ~10 hand-picked, source-traceable facts from the Phase 1 research files, tagged by brand category/topic — and tag-overlap retrieval (`retrieval/corpus-index.ts`). Deliberately not vector/embedding search (D-25): `pgvector` is Postgres-only and no embeddings API key exists here.
- No API routes or UI yet, by design — this milestone is shared infrastructure only, per `docs/phase2/MVP_ROADMAP.md`'s Milestone 4 scope; Milestone 5 builds the actual Market Intelligence features on top of it.
- Verified via build+lint+37 unit tests (8 new): retrieval ranking/limit/no-match behavior, mock provider's insufficient-data honesty and source traceability, AI Output Standard shape conformance.

## Phase 4 — Implementation, Milestone 3: Compliance OS remaining workflows (2026-07-27)

- HSN-chapter-keyed compliance lookup (`lib/modules/compliance/import/hsn-lookup.service.ts`) — curated seed table (apparel, footwear, cosmetics, toys, electronics, furniture chapters), deterministic and unit-tested, explicitly not exhaustive and labeled "requires further validation" for unknown chapters.
- Import Compliance checklist generation (IEC, DGFT/CBIC clearance, Legal Metrology labelling, BIS cross-reference) sharing the HSN lookup.
- BIS checklist generation (FMCS vs. CRS task sets), only creating tasks when the lookup actually flags BIS applicability.
- GST per-state registration tracker (manual add for now — auto-derivation from site/warehouse footprint is a documented Milestone 7 dependency, not a silent gap).
- Trademark/IP fixed-stage tracker (search → filing → examination → publication → opposition_window → registered), unit-tested stage progression.
- UI pages for all four workflows, linked from the Compliance overview.
- Verified via build+lint+29 unit tests (7 new)+live smoke test: apparel HSN correctly identified as non-BIS/labelling-required, toys HSN correctly triggers BIS CRS tasks, duplicate GST state registration correctly rejected (409), trademark stage advancement works end-to-end, overview correctly aggregates all 4 new workflow types alongside Entity Formation.

## Phase 4 — Implementation, Milestone 2: Compliance OS Entity Formation (2026-07-27)

- Deterministic entity-formation rules engine (`lib/modules/compliance/entity-formation/rules-engine.ts`) — 6-branch decision table covering all `EntityTypeRec` values, unit-tested for determinism and per-branch correctness.
- Per-entity-type checklist templates sourced from Phase 1 research, auto-created as `ComplianceWorkflowItem` rows on recommendation.
- Document Management: storage-adapter interface (local-filesystem dev default, S3 documented but not implemented until credentials exist), append-only versioning service, MIME-type/size validation, checksums.
- Content staleness helper (AC US-27) — unit-tested.
- API routes: entity-formation recommend, compliance overview, per-workflow-type view, workflow-item update, document upload/list.
- UI: Compliance overview (cross-workflow timeline) and Entity Formation questionnaire/recommendation/checklist pages.
- **Schema correction (D-24):** fixed drift between the Milestone 1 `Document`/`DocumentVersion` Prisma models and `docs/phase2/DATABASE_SCHEMA.md`'s actual design, caught while building this feature — corrected before any real document data existed.
- Verified via build+lint+22 unit tests (10 new) + live smoke test: recommendation generation, checklist creation, document upload (rejects `.txt`, accepts PDF), RBAC 403 (viewer denied `recommend`) vs 200 (viewer can view), tenant-scoped 404 for a nonexistent workflow item.

## Phase 4 — Implementation, Milestone 1: Platform Foundation (2026-07-26)

- Prisma schema for the complete data model (all 4 modules), SQLite for local dev / Postgres-compatible for production. Enums implemented as Zod-validated strings (SQLite doesn't support native Prisma enums); Json fields nullable rather than defaulted (SQLite generated invalid `DEFAULT {}` SQL for object/array defaults, silently truncating migrations — root-caused and fixed).
- NextAuth.js v5 (Credentials + JWT sessions), RBAC permission matrix + enforcement helper (unit-tested), shared API error envelope, audit-log helper.
- Onboarding, invitation (create/preview/accept), organization/member management, and session active-organization-switch API routes and UI pages.
- Seed script: demo org + 7 users (one per role, plus a Yorkstn Staff and a Partner demo account).
- **Structural fix:** moved the marketing site into an `app/(marketing)/` route group (URL-preserving `git mv`) so the new platform (`app/(platform)/app/**`) gets its own root layout — an initial attempt nested the platform under the marketing site's root layout, which would have leaked the marketing site's navbar/cursor-effects/cookie-banner onto every platform page.
- Tailwind v3 (pinned; v4 installed by default has an incompatible config model) scoped to platform routes only, prefixed and preflight-disabled.
- Verified via `npm run build`, `npm run lint`, `npm test` (10 unit tests), and a live smoke test (signup, login, session, RBAC 403-vs-200 enforcement, marketing site unaffected).
- Full decision trail: `DECISIONS.md` D-18 through D-23.

## Phase 3 — Per-Module Engineering Specs (2026-07-24)

- Added `docs/phase3/ai-market-intelligence-engineering-spec.md`, `compliance-operating-system-engineering-spec.md`, `partner-discovery-engineering-spec.md`, `retail-expansion-intelligence-engineering-spec.md`.
- Each spec defines internal `lib/modules/<name>/` file structure, Prisma model ownership, owned API routes, and a test plan, without re-deriving Phase 2's architecture decisions.
- Established the cross-module read rule: any module reading another module's data does so only through that module's exported read-only functions, never raw cross-module Prisma queries — critical for `dashboard-aggregation.service.ts` (Retail Expansion Intelligence), which is the one service whose primary job is composing reads across all four modules.

## Phase 2 — Product & Architecture Design (2026-07-24)

- Added `DECISIONS.md`, `PROJECT_MEMORY.md`, this `CHANGELOG.md`, and `TODO.md` as the project's top-level tracking documents.
- Added `BLUEPRINT.md` §8 addendum noting Phase 1 approval and pointing to `PROJECT_MEMORY.md` as the live status tracker going forward.
- Completed all 20 Phase 2 documents in `docs/phase2/`:
  - Foundational product docs: `PRD.md`, `PERSONAS.md`, `USER_STORIES.md`, `INFORMATION_ARCHITECTURE.md`, `FEATURE_SPECIFICATIONS.md`, `ACCEPTANCE_CRITERIA.md`.
  - Data & API docs: `DATABASE_SCHEMA.md`, `ERD.md`, `API_SPECIFICATION.md`, `AUTH_RBAC.md`.
  - Systems architecture docs: `SYSTEM_ARCHITECTURE.md`, `AI_ARCHITECTURE.md`, `TECH_STACK.md`, `SECURITY_ARCHITECTURE.md`, `DEPLOYMENT_ARCHITECTURE.md`.
  - Product planning docs: `UI_UX_WIREFRAMES.md`, `MVP_ROADMAP.md`, `PRODUCT_BACKLOG.md`, `MILESTONES.md`, `VALIDATION_PLAN.md`.
- Locked key architecture decisions: modular monolith inside the existing Next.js repo; Tailwind scoped to new platform routes only (marketing site untouched); Prisma + PostgreSQL (prod)/SQLite (dev); NextAuth.js Credentials+JWT auth; enum-based RBAC; AI service layer provider-agnostic with a deterministic mock default (no real LLM key required for a functional MVP); Expansion Readiness Score, Entity Formation recommendation, and Site Selection scoring are deterministic/rules-based, never LLM-generated. Full list: `DECISIONS.md`.
- Audited the existing `yorkstn/` Next.js marketing site (routes, components, styling, deployment) to plan Phase 4 reuse/migration; findings recorded in `PROJECT_MEMORY.md` §5.

## Phase 1 — Research (2026-07-23–24)

- `research/global-retail-market-entry-platforms.md` — global retail expansion/franchise/location-intelligence/partner-discovery competitive landscape.
- `research/global-enterprise-compliance-ai-platforms.md` — global trade compliance, ERP/CRM, payments, and enterprise AI landscape.
- `research/india-market-entry-regulatory-landscape.md` — India operational/regulatory landscape for foreign consumer brands (18 topic areas).
- `research/india-dpiit-startup-ecosystem.md` — DPIIT, Startup India (SISFS/FFS), and Startup Haryana official frameworks.
- `BLUEPRINT.md` — synthesis of the four reports into cross-cutting findings, strategic implications, and open questions; presented to the user for approval before proceeding.
