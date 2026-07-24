# Yorkstn — Project Memory

**Read this file first in any new session.** It is the single source of truth for "where did execution stop and what's next." Update it at the end of every work session — before ending a turn, not just at phase boundaries — so a fresh session with no conversation memory can resume correctly. Do not let it go stale: if you complete something, check its box or update its status here before moving on.

---

## 0. What Yorkstn is (one paragraph)

A technology-first Market Entry Operating System (SaaS + optional managed services) helping international consumer brands (fashion/lifestyle/kids/beauty/home-living/specialty) launch, operate, and scale in India, via four MVP modules: AI Market Intelligence, Compliance Operating System, Partner Discovery Platform, Retail Expansion Intelligence. Full detail: `docs/phase2/PRD.md`.

## 1. Phase status

| Phase | Status | Where the output lives |
|---|---|---|
| Phase 1 — Research | ✅ Complete | `research/*.md` (4 reports), synthesized in `BLUEPRINT.md` |
| Phase 2 — Product & architecture design | ✅ Complete (20/20 docs) | `docs/phase2/*.md` |
| Phase 3 — Per-module engineering specs | ⏳ Not started | will live in `docs/phase3/*.md` |
| Phase 4 — Implementation (production MVP) | ⏳ Not started | will live in `yorkstn/` (existing Next.js app) |

## 2. Phase 1 — Research (complete)

Four cited research reports plus a synthesis:
- `research/global-retail-market-entry-platforms.md`
- `research/global-enterprise-compliance-ai-platforms.md`
- `research/india-market-entry-regulatory-landscape.md`
- `research/india-dpiit-startup-ecosystem.md`
- `BLUEPRINT.md` — cross-report synthesis, strategic implications, open questions (still accurate; Phase 2 approved the assumptions it flagged — see `DECISIONS.md` D-01/D-02).

**Known caveat carried forward:** direct WebFetch to primary `.gov.in` sources returned HTTP 403 throughout Phase 1; all government-sourced facts were cross-verified via secondary sources, not read directly. See `docs/phase2/VALIDATION_PLAN.md` §4 for the specific high-stakes figures that need primary-source re-verification before shipping as authoritative in-product Compliance OS content.

## 3. Phase 2 — Product & architecture design (complete)

All 20 requested documents exist in `docs/phase2/`:

PRD, USER_STORIES, PERSONAS, INFORMATION_ARCHITECTURE, FEATURE_SPECIFICATIONS, ACCEPTANCE_CRITERIA, DATABASE_SCHEMA, ERD, API_SPECIFICATION, AUTH_RBAC, UI_UX_WIREFRAMES, SYSTEM_ARCHITECTURE, AI_ARCHITECTURE, TECH_STACK, SECURITY_ARCHITECTURE, DEPLOYMENT_ARCHITECTURE, MVP_ROADMAP, PRODUCT_BACKLOG, MILESTONES, VALIDATION_PLAN.

**Authorship note (matters if content ever looks inconsistent):** `PRD.md`, `PERSONAS.md`, `USER_STORIES.md`, `INFORMATION_ARCHITECTURE.md`, `FEATURE_SPECIFICATIONS.md`, `ACCEPTANCE_CRITERIA.md` were written directly in the main session as the canonical product-truth baseline. `AI_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DEPLOYMENT_ARCHITECTURE.md`, `MVP_ROADMAP.md`, `PRODUCT_BACKLOG.md`, `SECURITY_ARCHITECTURE.md`, `SYSTEM_ARCHITECTURE.md`, `TECH_STACK.md`, `UI_UX_WIREFRAMES.md` were written by three background research agents (all three hit the account's session-usage limit mid-run, but their file-writes had already completed — verified). `ERD.md`, `API_SPECIFICATION.md`, `AUTH_RBAC.md`, `MILESTONES.md`, `VALIDATION_PLAN.md` were the genuinely-missing files from those agents' scope, written directly afterward, cross-checked against the already-completed `DATABASE_SCHEMA.md` for naming consistency. Full decision trail: `DECISIONS.md` D-17.

**Key approved assumptions (from the user, 2026-07-24 — treat as durable unless future validated research overrides them):**
- ICP, business model, and 4-module MVP scope per `docs/phase2/PRD.md` §3–5 (`DECISIONS.md` D-01, D-02).

**Key architecture decisions already locked (see `DECISIONS.md` for full list D-01 through D-17):**
- Modular monolith inside the existing Next.js repo (D-06, D-07), Tailwind scoped to new platform routes only (D-08), Prisma + Postgres/SQLite (D-09), NextAuth.js Credentials+JWT (D-10), enum-based RBAC (D-03), AI service layer provider-agnostic with a mock default — **no real LLM key required for a functional MVP** (D-11), deterministic features (Readiness Score, Entity Formation recommendation, Site Selection scoring) are never LLM-generated (D-04).

## 4. Phase 3 — Next action

**Not yet started.** Per the user's instruction: "Design the production architecture for every module and generate all engineering documentation required for implementation."

Plan (adjust if reality diverges once started): write `docs/phase3/<module>-engineering-spec.md` for each of the 4 MVP modules (ai-market-intelligence, compliance-operating-system, partner-discovery, retail-expansion-intelligence), each going one level deeper than Phase 2's system-wide architecture docs into module-specific implementation detail (exact component/service boundaries within the modular monolith, exact Prisma models touched, exact API routes owned, test plan). Phase 2's `SYSTEM_ARCHITECTURE.md`, `AI_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, and `API_SPECIFICATION.md` are the inputs — Phase 3 should not re-derive or contradict them, only add implementation-level depth plus a migration/build-order plan (which can mostly reuse `MVP_ROADMAP.md`'s milestone sequencing rather than re-deriving it).

## 5. Phase 4 — Next action (after Phase 3)

**Not yet started.** Repo audit for Phase 4 is already done (see `docs/phase3/` once written, and the audit findings below) — do not repeat it.

**Existing repo audit findings (already gathered, do not re-audit):**
- `yorkstn/` is a Next.js 14.2.35 App Router site, TypeScript strict, React 18, ESLint, no Tailwind, no ORM, no auth, no test framework yet.
- Pages: `/`, `/about`, `/contact`, `/india`, `/insights`, `/services`, `/privacy`, `/terms`, plus `app/api/enquiry/route.ts` (AWS SES contact-form handler).
- Components: `Navbar`, `Footer`, `MenuOverlay`, `InquiryModal`, `CookieBanner`, `ClientEffects` — all part of the marketing site's bespoke custom-cursor/grain-texture aesthetic (`app/globals.css`, CSS custom properties, no utility framework). **Do not touch these or the marketing pages** (`DECISIONS.md` D-07).
- Deployment: AWS Amplify via `yorkstn/amplify.yml` (`appRoot: yorkstn`). `.env.local.example` currently only lists `NEXT_PUBLIC_GA_ID` and AWS SES credentials.
- `Backup_Code` (repo root) and `Layout_backup`/`Page_backup` (inside `yorkstn/app/`) appear to be prior iteration artifacts, not currently imported/used anywhere live — leave them alone unless a specific reason to remove them arises; do not delete speculatively.

Build order for Phase 4 (from `docs/phase2/MVP_ROADMAP.md`): Milestone 1 (Platform Foundation: auth/org/RBAC/seed data) → Milestone 2–3 (Compliance OS) → Milestone 4 (AI service layer, mock provider) → Milestone 5 (AI Market Intelligence) → Milestone 6 (Partner Discovery) → Milestone 7 (Retail Expansion Intelligence) → Milestone 8 (Managed Services + hardening). Definition of done per milestone: `docs/phase2/MILESTONES.md`.

**Credentials/infra genuinely not available in this environment (do not attempt to fabricate; work around per `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8, flag and continue rather than stopping):**
- Production/staging PostgreSQL connection (use SQLite locally in the meantime).
- AWS S3 bucket + IAM credentials for document storage (stub/local-filesystem or documented no-op in the meantime).
- Real `NEXTAUTH_SECRET` per environment beyond a local dev value.
- Real LLM API key (`ANTHROPIC_API_KEY`) — MVP ships fully functional on the `mock` AI provider (D-11); this is not a blocker.
- Sentry (or equivalent) account for error tracking.
- Any licensed external data feed (real-time competitor pricing, live BIS certification status, live footfall/CRE data) — MVP ships these as clearly-labeled seed/curated data instead, per `docs/phase2/AI_ARCHITECTURE.md` Category (d).

## 6. How to resume this project in a new session

1. Read this file fully.
2. Skim `BLUEPRINT.md`, `DECISIONS.md`, `CHANGELOG.md`, `TODO.md`.
3. Check `git log --oneline` and `git status` against the "Phase status" table above — if a doc/file this memory claims exists is missing, or vice versa, trust the actual repo state and correct this file first.
4. Resume at the first unchecked item in `TODO.md`.
