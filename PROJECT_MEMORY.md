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
| Phase 3 — Per-module engineering specs | ✅ Complete (4/4 specs) | `docs/phase3/*.md` |
| Phase 4 — Implementation (production MVP) | ✅ Complete (8/8 milestones) | `yorkstn/` (existing Next.js app) |

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

**Key architecture decisions already locked (see `DECISIONS.md` for full list D-01 through D-34):**
- Modular monolith inside the existing Next.js repo (D-06, D-07), Tailwind scoped to new platform routes only (D-08), Prisma + Postgres/SQLite (D-09), NextAuth.js Credentials+JWT (D-10), enum-based RBAC (D-03), AI service layer provider-agnostic with a mock default — **no real LLM key required for a functional MVP** (D-11), deterministic features (Readiness Score, Entity Formation recommendation, Site Selection scoring) are never LLM-generated (D-04).

## 4. Phase 3 — Complete

4 engineering specs in `docs/phase3/`: `ai-market-intelligence-engineering-spec.md`, `compliance-operating-system-engineering-spec.md`, `partner-discovery-engineering-spec.md`, `retail-expansion-intelligence-engineering-spec.md`. Each defines: exact `lib/modules/<name>/` internal file structure, which Prisma models the module owns (vs. reads cross-module via exported functions only — never raw cross-module Prisma queries, a hard rule established in these specs), exact API routes owned, and a test plan. The three deterministic-feature purity rules (Readiness Score, Entity Formation recommendation, Site Selection scoring — all pure functions, no I/O/AI calls, versioned) are consistently cross-referenced across all 4 specs from `DECISIONS.md` D-04.

## 5. Phase 4 — Implementation (complete — MVP shipped, 8/8 milestones)

Repo audit already done (§ below) — do not repeat it. Follow `docs/phase2/MVP_ROADMAP.md` milestone order; check off `TODO.md` as each lands.

**Existing repo audit findings (already gathered, do not re-audit):**
- `yorkstn/` is a Next.js 14.2.35 App Router site, TypeScript strict, React 18, ESLint, no Tailwind, no ORM, no auth, no test framework yet.
- Pages: `/`, `/about`, `/contact`, `/india`, `/insights`, `/services`, `/privacy`, `/terms`, plus `app/api/enquiry/route.ts` (AWS SES contact-form handler).
- Components: `Navbar`, `Footer`, `MenuOverlay`, `InquiryModal`, `CookieBanner`, `ClientEffects` — all part of the marketing site's bespoke custom-cursor/grain-texture aesthetic (`app/(marketing)/globals.css`, CSS custom properties, no utility framework). **Do not touch these or the marketing pages** (`DECISIONS.md` D-07).
- Deployment: AWS Amplify via `yorkstn/amplify.yml` (`appRoot: yorkstn`).
- `Backup_Code` (repo root) and `Layout_backup`/`Page_backup` (now inside `yorkstn/app/(marketing)/`) appear to be prior iteration artifacts, not currently imported/used anywhere live — leave them alone unless a specific reason to remove them arises; do not delete speculatively.
- **Structural note (Phase 4, D-23):** the marketing site was moved into `app/(marketing)/` (a route group — URLs unchanged) so the new platform section could get its own root layout (`app/(platform)/app/layout.tsx`) instead of inheriting the marketing site's navbar/cursor-effects/cookie-banner. This was a `git mv`-only move (no content changes) — verify with `git log --follow` on any marketing file if history looks confusing.

Build order for Phase 4 (from `docs/phase2/MVP_ROADMAP.md`): Milestone 1 (Platform Foundation: auth/org/RBAC/seed data) → Milestone 2–3 (Compliance OS) → Milestone 4 (AI service layer, mock provider) → Milestone 5 (AI Market Intelligence) → Milestone 6 (Partner Discovery) → Milestone 7 (Retail Expansion Intelligence) → Milestone 8 (Managed Services + hardening). Definition of done per milestone: `docs/phase2/MILESTONES.md`.

### Milestone 1 — Platform Foundation: COMPLETE

All DoD items met (verified via `npm run build`, `npm run lint`, `npm test`, and a live smoke test with curl: signup, login, session, RBAC 403 vs 200, marketing site unaffected). Key files for a fresh session to orient from:
- `yorkstn/prisma/schema.prisma` — full data model, all 4 modules. As of Milestone 8 every table has real API routes and UI built against it (Milestone 1 shipped only the identity/org tables' routes; Milestones 2–8 built out the rest — see each milestone's section below).
- `yorkstn/auth.ts` — NextAuth.js v5 config. **Gotcha already solved, don't re-debug it:** `next-auth/jwt`'s `JWT` type is a re-export of `@auth/core/jwt`'s — module augmentation must target `@auth/core/jwt` directly (see `yorkstn/types/next-auth.d.ts`) or `token.*` fields silently type as `unknown`.
- `yorkstn/lib/auth/rbac.ts` — the permission matrix, single source of enforcement truth, unit-tested in `rbac.test.ts`.
- `yorkstn/lib/auth/session.ts` — `requireSession()`/`requireOrgContext()`, used by every API route.
- `yorkstn/prisma/seed.ts` — demo org "Acme Kids Apparel (Demo)" + 7 users (all password `password123`): one per role (`priya.owner@…`, `admin@…`, `arjun.compliance@…`, `meera.analyst@…`, `viewer@…`), plus `ananya.staff@yorkstn.com` (yorkstn_staff) and `rohan.partner@demo.yorkstn.com` (partner). Run `npm run db:seed` after any `prisma migrate dev`/`reset` (reset runs it automatically).
- Routes live at `yorkstn/app/(platform)/app/**` (URL: `/app/**`) — signup, login, onboarding, dashboard, invite/:token, settings/members all working end-to-end.
- **Database resets are a real risk, not routine** — Prisma's own tooling hard-blocks `migrate reset`/similar when it detects an AI agent, requiring explicit per-instance user consent (see `DECISIONS.md` D-22's resolution history for the exact protocol that was followed: confirm exact path + untracked-by-git + no shared DB, get explicit "yes," pass consent via `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`). Don't route around this by deleting `dev.db` directly without going through that same confirmation process again in a future session, even though it's "just" a local file. **The user has already granted standing consent for resets on this exact file** under these same conditions (2026-07-26/27) — re-verify the three facts each time before reusing the same consent text, but a fresh AskUserQuestion round-trip is not required unless something about the file/scope has changed.

### Milestone 2 — Compliance OS: Entity Formation: COMPLETE

Deterministic rules engine (`lib/modules/compliance/entity-formation/rules-engine.ts`, 6-branch decision table, unit-tested), checklist templates, Document Management (storage adapter + versioning service + MIME/size validation), content staleness helper. API routes under `app/api/v1/compliance/**`. UI at `app/(platform)/app/compliance/**`. Verified via build+lint+22 tests+live smoke test (see `CHANGELOG.md`).
**Note for future sessions:** while building this, found and fixed real drift between the Milestone 1 `Document`/`DocumentVersion` schema and `docs/phase2/DATABASE_SCHEMA.md`'s actual design (D-24) — if anything else in the schema looks inconsistent with the docs, treat `DATABASE_SCHEMA.md` as the tiebreaker and fix forward the same way (check for existing data first; these tables were empty so no data-loss risk existed).

### Milestone 3 — Compliance OS: remaining workflows: COMPLETE

Import (`lib/modules/compliance/import/`), BIS (shares the same HSN lookup), GST (`app/api/v1/compliance/gst/states`), Trademark (`lib/modules/compliance/trademark/`). All four have UI pages under `app/(platform)/app/compliance/{import,bis,gst,trademark}`. The cross-workflow timeline (`/app/compliance`, `/api/v1/compliance/overview`) already aggregated all workflow types since Milestone 2 built it type-agnostic — no additional work needed there.
**Known, documented (not silent) gap — still open as of MVP completion:** GST state registration is added manually; auto-flagging from the org's site/warehouse footprint depends on Retail Expansion Intelligence's `sites`, noted inline in `app/api/v1/compliance/gst/states/route.ts`'s docstring. Milestone 7 (which built `sites`) has since landed and made this unblockable, but the actual auto-flagging wire-up was explicitly out of that milestone's US-40–46 scope and was not done — see Milestone 7's section below, point 3. This is a real, tracked, non-blocking post-MVP follow-up, not something Milestone 7 silently resolved.

### Milestone 4 — AI Service Layer: COMPLETE

`lib/modules/market-intelligence/ai-provider/` (types, mock provider, Claude provider, factory) + `lib/modules/market-intelligence/retrieval/` (curated corpus + tag-overlap retrieval). No API/UI — this milestone is infrastructure only, consumed starting in Milestone 5.
**Important for Milestone 5:** call `getAiProvider()` from `lib/modules/market-intelligence/ai-provider/index.ts` — never instantiate `MockAiProvider`/`ClaudeAiProvider` directly in feature code, or the `AI_PROVIDER` env-var switch stops working. `ClaudeAiProvider` has never been run against a real key in this environment — if `AI_PROVIDER=anthropic` is ever enabled, test it for real before trusting its output shape.

### Milestone 5 — AI Market Intelligence module: COMPLETE

All 6 generative features (`lib/modules/market-intelligence/insights/*`, `city-recommendations.service.ts`) + the deterministic Expansion Readiness Score (`readiness-score/`). API under `app/api/v1/market-intelligence/**`, UI at `app/(platform)/app/market-intelligence`. Verified via build+lint+46 tests+live smoke test.
**Note for future sessions:** the mock AI provider's corpus (`lib/modules/market-intelligence/retrieval/corpus.ts`) only has ~10 entries — expect `insufficient_data` results for anything outside apparel/footwear/cosmetics/toys/electronics/furniture and the general India market-entry topics already covered. Expanding the corpus (more categories, more cities' `distributionMaturity`/`realEstateCostBenchmark` data) is a legitimate, low-risk way to make demos richer without touching any code logic.

### Milestone 6 — Partner Discovery Platform: COMPLETE

`lib/modules/partners/{directory,verification,introductions,recommendations}/`. Three separate auth contexts now exist in `lib/auth/session.ts`: `requireOrgContext` (brand-side), `requireStaffSession` (Yorkstn Staff, platform-wide since `partners` isn't tenant data), `requirePartnerContext` (partner-portal, resolves via `User.partnerId`). Partner portal is a fully separate route group/root layout at `app/(platform)/partner-portal/**` (its own `<html>`, distinct from both marketing and `/app`).
**Two things worth knowing if you touch this module again:**
1. `ai_insight_category` now has a 7th value, `partner_recommendation` (D-26) — `DATABASE_SCHEMA.md` itself never listed it; if you're cross-checking Prisma against that doc and something about partner recommendations looks missing there, this is why.
2. **A real bug was found and fixed here, not in Milestone 1 where it was introduced:** `tailwind.config.js`'s `content` globs were stale from before the D-23 marketing-site/platform split (still pointed at `app/app/**` instead of `app/(platform)/app/**`), meaning Tailwind likely generated near-zero utility CSS for every page built in Milestones 2, 3, and 5 — functionally fine, visually broken. Fixed now; if anything from those earlier milestones still looks unstyled when actually viewed in a browser (not yet done in this session — all verification so far has been via curl/API, not a rendered browser check), rebuild and check `.next/static/css/*.css` for `tw-` rules the way this fix was verified.

### Milestone 7 — Retail Expansion Intelligence: COMPLETE

`lib/modules/expansion/{content,site-selection,roadmap,financial-projections}/`, `launch-tasks.service.ts`, `dashboard-aggregation.service.ts`. API under `app/api/v1/expansion/**` and `app/api/v1/dashboard`. UI at `app/(platform)/app/expansion/**` (overview, cities, cities/[cityId], malls/[mallId], sites, financial-projections, launch-tasks) plus the Milestone 1 placeholder dashboard now rendering real composed data via `components/platform/DashboardSummary.tsx`. Verified via build+lint+57 tests+live smoke test.
**Three things worth knowing if you touch this module again:**
1. `computeSiteScore` (`site-selection/scoring-engine.ts`) is the third pure/deterministic/unit-tested scoring function alongside the Readiness Score and City Recommendations (D-04) — reuses `scoreDistributionMaturity` from the Market Intelligence module rather than duplicating the maturity-level convention.
2. **Real bugs found and fixed via live smoke test, not by inspection (D-27, D-28, D-29):** onboarding never created `RoadmapMilestone` rows for real orgs; the sites/launch-tasks routes' `.uuid()` Zod constraints rejected legitimate references to seed data's human-readable ids (e.g. `seed-mall-mumbai-phoenix`); `site_selection`'s roadmap status was missing an `in_progress` state that the other four milestones already had. All three fixed forward.
3. Milestone 3's noted gap ("GST state registration auto-flagging depends on Milestone 7's `sites`") is now unblockable — `Site` rows exist — but the actual auto-flagging wire-up itself was not done in Milestone 7 (out of this milestone's US-40–46 scope); it remains open, now trackable against real `Site` data instead of a future dependency.

### Milestone 8 — Managed Services + cross-cutting hardening: COMPLETE (final milestone — MVP done)

`lib/modules/managed-services/engagement.service.ts`. API under `app/api/v1/managed-services/**` (brand-side) and `app/api/v1/admin/managed-services/**` (staff-side). UI at `app/(platform)/app/managed-services` (brand) and `app/(platform)/app/admin/managed-services` (staff, no `AppShell` — same bare-container pattern as the Milestone 6 partner-verification queue) plus a new `app/(platform)/app/settings/audit-log` page. CI added at `.github/workflows/ci.yml`. Verified via build+lint+58 tests+live smoke test.
**Four things worth knowing if you touch this module again:**
1. Assignment is platform-admin-only (`requireStaffSession()` now returns a DB-fresh `isPlatformAdmin`, D-31); posting an update requires being the specifically-assigned staff member (or a platform admin). Both enforced inside `engagement.service.ts`, not just at the route layer, and both were live-tested with a second, non-admin staff user created directly via the Prisma client for the test then deleted.
2. **Seed data gotcha (D-32):** `ananya.staff@yorkstn.com` is the only seeded Yorkstn Staff user and is now also the only seeded platform admin — if you ever add a second staff user to the seed, decide deliberately whether they should also be an admin; don't assume it.
3. **The audit-log sweep (D-33) is complete as of this milestone** — every mutating route in the entire product writes an audit log except `session/active-organization` (no DB write at all). If you add a new mutating route in the future, add `writeAuditLog` to it in the same PR — the mechanical `grep -L writeAuditLog $(routes exporting POST/PATCH/PUT/DELETE)` sweep technique used to find the Milestone 8 gaps is quick to re-run and worth doing again before any future release claiming this property.
4. **CI now actually exists** (`.github/workflows/ci.yml`, D-34) — `DEPLOYMENT_ARCHITECTURE.md` had described it as "deployable today" for milestones, but no workflow file existed until this one. It runs lint/test/build on every push/PR using the `mock` AI provider and a throwaway SQLite file — zero repository secrets required.

**Credentials/infra genuinely not available in this environment (do not attempt to fabricate; work around per `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8, flag and continue rather than stopping) — reviewed and confirmed still accurate as of Milestone 8, the milestone whose DONE WHEN explicitly calls for this review:**
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
4. Resume at the first unchecked item in `TODO.md`. **As of Milestone 8, the MVP itself is complete (8/8 milestones, all 4 modules + Managed Services + hardening) — there is no Milestone 9 in any doc.** Remaining unchecked `TODO.md` items are the Milestone 1 follow-ups (non-blocking UX polish) and the standing pre-launch items (primary-source re-verification, credentials provisioning, customer-discovery validation) — do not invent new scope beyond what `docs/phase2/MVP_ROADMAP.md`/`MILESTONES.md` actually specify.
