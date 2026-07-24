# Changelog

All notable changes to the Yorkstn project (research, product/architecture design, and implementation) are recorded here, most recent first. This complements `git log` with phase-level context; it does not replace commit messages.

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
