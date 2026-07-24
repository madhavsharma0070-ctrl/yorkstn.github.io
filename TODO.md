# Yorkstn — TODO

Live action tracker. Check items off as completed; the first unchecked item is where the next session should resume (per `PROJECT_MEMORY.md` §6). Keep this file honest — do not check something off before it's actually done and committed.

## Phase 3 — Per-module engineering specs (next up)

- [ ] `docs/phase3/ai-market-intelligence-engineering-spec.md`
- [ ] `docs/phase3/compliance-operating-system-engineering-spec.md`
- [ ] `docs/phase3/partner-discovery-engineering-spec.md`
- [ ] `docs/phase3/retail-expansion-intelligence-engineering-spec.md`
- [ ] Update `PROJECT_MEMORY.md` §1 (phase status table) and `CHANGELOG.md` once Phase 3 is complete.

## Phase 4 — Implementation (after Phase 3)

Following `docs/phase2/MVP_ROADMAP.md` / `docs/phase2/MILESTONES.md` sequencing:

- [ ] Milestone 1 — Platform Foundation (Prisma schema + SQLite dev DB, NextAuth.js credentials+JWT, RBAC helper + tests, org/brand-profile onboarding, seed script, empty-state dashboard).
- [ ] Milestone 2 — Compliance OS: Entity Formation vertical slice (rules engine, document versioning, staleness indicator).
- [ ] Milestone 3 — Compliance OS: remaining workflows (Import/GST/BIS/Trademark) + cross-workflow timeline.
- [ ] Milestone 4 — AI service layer (provider-agnostic interface, mock provider, RAG scaffolding over seed corpus).
- [ ] Milestone 5 — AI Market Intelligence module (all 7 features + Readiness Score).
- [ ] Milestone 6 — Partner Discovery Platform (directory/search, partner portal, verification queue, introduction requests, AI recommendations).
- [ ] Milestone 7 — Retail Expansion Intelligence (city/mall intelligence, site selection, roadmap, financial projections, launch planning, Expansion Dashboard).
- [ ] Milestone 8 — Managed Services + cross-cutting hardening (audit log sweep, full RBAC re-verification, provisioning-checklist review).
- [ ] Update `PROJECT_MEMORY.md`, `CHANGELOG.md` at each milestone boundary, and after every work session regardless of milestone boundary.

## Standing items (ongoing, not phase-bound)

- [ ] Re-verify the Phase 1 research figures listed in `docs/phase2/VALIDATION_PLAN.md` §4 against live `.gov.in` primary sources before any are surfaced as authoritative Compliance OS content to a real customer.
- [ ] Before production launch: provision the credentials/infra listed in `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8 and `PROJECT_MEMORY.md` §5 (Postgres, S3, `NEXTAUTH_SECRET`, optionally a real LLM key, Sentry). None of these block MVP functionality on the `mock` AI provider + SQLite.
- [ ] Run the customer-discovery and design-partner-pilot validation described in `docs/phase2/VALIDATION_PLAN.md` §1–3 once the MVP is demoable, to test (not assume) the core "integrated platform" hypothesis.

## Completed

- [x] Phase 1 — Research (4 reports + `BLUEPRINT.md` synthesis), approved by user 2026-07-24.
- [x] Phase 2 — Product & Architecture Design (20/20 docs in `docs/phase2/`).
- [x] Top-level tracking docs created: `PROJECT_MEMORY.md`, `DECISIONS.md`, `CHANGELOG.md`, `TODO.md`, `BLUEPRINT.md` §8 addendum.
- [x] Existing `yorkstn/` Next.js repo audited for Phase 4 reuse/migration planning.
