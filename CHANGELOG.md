# Changelog

All notable changes to the Yorkstn project (research, product/architecture design, and implementation) are recorded here, most recent first. This complements `git log` with phase-level context; it does not replace commit messages.

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
