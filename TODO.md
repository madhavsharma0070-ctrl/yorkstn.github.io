# Yorkstn — TODO

Live action tracker. Check items off as completed; the first unchecked item is where the next session should resume (per `PROJECT_MEMORY.md` §6). Keep this file honest — do not check something off before it's actually done and committed.

## Phase 4 — Implementation (in progress)

Following `docs/phase2/MVP_ROADMAP.md` / `docs/phase2/MILESTONES.md` sequencing:

- [x] Milestone 1 — Platform Foundation (Prisma schema + SQLite dev DB, NextAuth.js credentials+JWT, RBAC helper + tests, org/brand-profile onboarding, seed script, empty-state dashboard, org switcher, sign-out). Verified via build+lint+unit tests+live smoke test (signup, login, RBAC 403/200, marketing site unaffected).
- [ ] Milestone 2 — Compliance OS: Entity Formation vertical slice (rules engine, document versioning, staleness indicator).
- [ ] Milestone 3 — Compliance OS: remaining workflows (Import/GST/BIS/Trademark) + cross-workflow timeline.
- [ ] Milestone 4 — AI service layer (provider-agnostic interface, mock provider, RAG scaffolding over seed corpus).
- [ ] Milestone 5 — AI Market Intelligence module (all 7 features + Readiness Score).
- [ ] Milestone 6 — Partner Discovery Platform (directory/search, partner portal, verification queue, introduction requests, AI recommendations).
- [ ] Milestone 7 — Retail Expansion Intelligence (city/mall intelligence, site selection, roadmap, financial projections, launch planning, Expansion Dashboard).
- [ ] Milestone 8 — Managed Services + cross-cutting hardening (audit log sweep, full RBAC re-verification, provisioning-checklist review).
- [ ] Update `PROJECT_MEMORY.md`, `CHANGELOG.md` at each milestone boundary, and after every work session regardless of milestone boundary.

## Milestone 1 follow-ups (non-blocking, deferred)

- [ ] Wire invitation emails through the existing AWS SES integration (`app/api/enquiry/route.ts` already has a working SES client) — invitations are fully functional today via their direct `/app/invite/:token` link, shown/copyable in the Members UI, so this is a UX polish item, not a functional gap.
- [ ] Add an automated integration test asserting a session's active-organization claim can't be set to an org the caller isn't a member of (verified manually via live smoke test during Milestone 1; not yet covered by an automated test since it needs a seeded test DB, not just pure-function unit tests).

## Standing items (ongoing, not phase-bound)

- [ ] Re-verify the Phase 1 research figures listed in `docs/phase2/VALIDATION_PLAN.md` §4 against live `.gov.in` primary sources before any are surfaced as authoritative Compliance OS content to a real customer.
- [ ] Before production launch: provision the credentials/infra listed in `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8 and `PROJECT_MEMORY.md` §5 (Postgres, S3, `NEXTAUTH_SECRET`, optionally a real LLM key, Sentry). None of these block MVP functionality on the `mock` AI provider + SQLite.
- [ ] Run the customer-discovery and design-partner-pilot validation described in `docs/phase2/VALIDATION_PLAN.md` §1–3 once the MVP is demoable, to test (not assume) the core "integrated platform" hypothesis.

## Completed

- [x] Phase 1 — Research (4 reports + `BLUEPRINT.md` synthesis), approved by user 2026-07-24.
- [x] Phase 2 — Product & Architecture Design (20/20 docs in `docs/phase2/`).
- [x] Top-level tracking docs created: `PROJECT_MEMORY.md`, `DECISIONS.md`, `CHANGELOG.md`, `TODO.md`, `BLUEPRINT.md` §8 addendum.
- [x] Existing `yorkstn/` Next.js repo audited for Phase 4 reuse/migration planning.
- [x] Phase 3 — Per-module engineering specs (4/4 in `docs/phase3/`).
