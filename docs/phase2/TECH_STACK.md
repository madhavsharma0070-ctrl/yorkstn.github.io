# Yorkstn — Technology Stack

**Phase:** 2 (Product & Architecture Design)
**Depends on:** `SYSTEM_ARCHITECTURE.md`, `AI_ARCHITECTURE.md`
**Scope:** The stack for the new authenticated platform section, extending the existing Next.js repo. Every recommendation below is justified against MVP constraints — small team, existing repo, no new cloud credentials provisioned yet in this environment, need for shipping velocity over enterprise-scale hypotheticals — not against "what a large engineering org would eventually want."

Current baseline (already in the repo, confirmed from `yorkstn/package.json` and `yorkstn/next.config.mjs`): Next.js 14.2.35, React 18, TypeScript ^5 (strict mode), ESLint 8 (`eslint-config-next`), `@aws-sdk/client-ses` for the contact form, no Tailwind, no ORM, no auth library, no database. Deployment is AWS Amplify per `amplify.yml` (`appRoot: yorkstn`, `npm ci` → `next build`, artifacts from `.next`).

---

## 1. Framework: Next.js 14 App Router + TypeScript — keep, extend

No change. The platform ships as new route groups (`app/app/**`, `app/api/**`, `app/partner-portal/**`) inside the same Next.js application, per `SYSTEM_ARCHITECTURE.md` §1's modular-monolith argument. Rebuilding on a different framework (e.g., a separate SPA + API service) would contradict the explicit requirement to extend this repo and would duplicate hosting/CI/auth work the team doesn't need to do twice. TypeScript strict mode (already configured in `tsconfig.json`) continues unchanged for the new code.

---

## 2. Styling: introduce Tailwind CSS, scoped to platform routes only

**Recommendation: add Tailwind CSS for the new authenticated platform section (`app/app/**`, `app/partner-portal/**`, `components/platform/**`). Do NOT touch, migrate, or refactor the existing marketing site's custom CSS system.**

Justification:
- The marketing site's hand-written CSS system works, is presumably already visually finished/approved, and migrating it to Tailwind would be pure risk (regressions, review overhead) for zero product value — the task is additive, not a redesign.
- The platform section is a different kind of UI: dense, data-heavy, form-and-table-driven authenticated screens (dashboards, filters, workflow trackers) across ~30+ routes per `INFORMATION_ARCHITECTURE.md`. Hand-rolling custom CSS at that surface area, solo or on a small team, is materially slower than a utility-first system with a design-token config — velocity matters more here than for a handful of marketing pages.
- Next.js App Router supports per-route-group styling cleanly; Tailwind can be configured with `content` globs restricted to the new platform directories so its utility classes and generated CSS have zero footprint on the marketing site's existing pages and bundle.
- Concretely: install `tailwindcss`, `postcss`, `autoprefixer` as dev dependencies; a `tailwind.config.ts` with `content: ["./app/app/**/*.{ts,tsx}", "./app/partner-portal/**/*.{ts,tsx}", "./components/platform/**/*.{ts,tsx}"]`; a platform-only global stylesheet (e.g., `app/app/globals.css` with `@tailwind` directives) imported only from the platform's root layout, not the marketing site's `app/layout.tsx` / `app/globals.css`.
- Alternative considered and rejected: CSS Modules (also zero-conflict-risk, matches existing convention more closely) — rejected in favor of Tailwind specifically because the platform's UI surface (many similar dashboard/table/form patterns across 4 modules) benefits more from utility-class consistency and a shared design-token config than from one-off module files per component; a small team building fast benefits from not inventing a new class name per element.

---

## 3. ORM: Prisma

**Recommendation: Prisma**, as the sole data-access layer for all new platform tables.

Justification: Prisma's schema-first model gives one authoritative, readable source of truth for the shared entity graph the four modules depend on (Organization, User, Brand Profile, Compliance Workflow Item, Partner, AiInsight, AuditLog, Job — per `SYSTEM_ARCHITECTURE.md`), which matters more here than raw query flexibility given a small team that needs to move across modules quickly without relearning a bespoke query layer per module. Prisma Migrate gives versioned, reviewable schema migrations essential for a project where the schema will change fast across four modules built roughly in parallel. Prisma's generated TypeScript client also keeps end-to-end type safety consistent with the repo's existing strict-TypeScript convention, and works identically against SQLite (local) and PostgreSQL (staging/prod) with only a `datasource` provider change, which directly supports the recommendation in §4.

---

## 4. Database: PostgreSQL (production/staging), SQLite (local dev)

**Recommendation: PostgreSQL for staging/production; SQLite for local development.**

- PostgreSQL is the production target because the platform needs relational integrity across a genuinely relational entity graph (multi-tenant orgs, RBAC, workflow state, `pgvector` for RAG per `AI_ARCHITECTURE.md`), full-text search (`SYSTEM_ARCHITECTURE.md` §6), and mature managed-hosting options that pair naturally with AWS (where SES is already in use).
- SQLite is recommended for local dev **specifically because no cloud database credentials exist in this environment** — a new engineer (or this Phase 4 build) can `prisma migrate dev` against a local `dev.db` file with zero external setup, which matters for velocity when there's no provisioned staging Postgres yet to point local dev at. Prisma's schema stays provider-agnostic enough (avoiding Postgres-only features like `pgvector` and native full-text in the schema shared with SQLite, or gating those behind a Postgres-only migration) that this doesn't create two divergent data models — see the note below.
- **Requires credentials:** a real managed PostgreSQL instance (e.g., AWS RDS or Aurora Serverless, to stay in the AWS ecosystem already used for SES/Amplify) for staging and production. This is explicitly flagged in `DEPLOYMENT_ARCHITECTURE.md`'s infrastructure checklist as something Yorkstn's team must provision — it is not fabricated or assumed to already exist.
- **Caveat on SQLite/Postgres parity:** `pgvector` (for RAG retrieval, `AI_ARCHITECTURE.md` §1) and Postgres-native full-text search (`SYSTEM_ARCHITECTURE.md` §6) are Postgres-only. Local dev against SQLite should mock/stub those two subsystems (the `mock` AI provider already returns deterministic output without needing real vector search; local search can fall back to a simple `LIKE`/JS-filter implementation) rather than pretend SQLite has vector/FTS parity it doesn't. This is a known, accepted local-dev limitation, not a design flaw.

---

## 5. Authentication: NextAuth.js (Auth.js)

**Recommendation: NextAuth.js (the Auth.js project), using its Credentials provider plus email/passwordless or OAuth providers as needed, backed by the Prisma adapter.**

Justification: NextAuth.js is the de facto standard for Next.js App Router auth, has a maintained Prisma adapter (matching the ORM choice in §3), supports the session model this platform needs (organization-scoped sessions, multi-org membership per `INFORMATION_ARCHITECTURE.md` §4's org switcher) without requiring a third-party auth service with its own pricing/credential setup (e.g., Auth0, Clerk) — keeping the "no new cloud credentials required to start building" property that also drives the SQLite choice. Building a bespoke auth system instead would be pure unnecessary risk (session security, password hashing, CSRF) for a solved problem; adopting a heavier third-party IDaaS would add a paid external dependency before there's a validated need for its extra features (SSO, enterprise directory sync) that MVP customers won't need on day one.

---

## 6. File storage: AWS S3 (S3-compatible)

**Recommendation: AWS S3**, used for Compliance OS document uploads (2.6) and Partner verification documents (3.5).

Justification: AWS is already the deployment/email vendor (Amplify hosting, SES for email) — adding S3 keeps infrastructure in one cloud account/IAM boundary rather than introducing a second cloud vendor (e.g., Cloudinary, a separate GCS bucket) for no functional gain. S3 also has first-class support for the two concrete needs here: private-by-default buckets with signed/expiring URLs for document access control (see `SECURITY_ARCHITECTURE.md`), and lifecycle policies for retention. **Requires credentials:** an S3 bucket and IAM credentials/role scoped to it do not exist in this environment yet and must be provisioned — flagged in `DEPLOYMENT_ARCHITECTURE.md`'s checklist. Locally, Phase 4 development can either stub file storage behind the same interface (writing to local disk in dev) or use a local S3-compatible emulator (e.g., MinIO) if actual upload/download behavior needs testing before real credentials exist.

---

## 7. Background jobs: DB-backed job table + scheduled function, not a dedicated queue service

Per `SYSTEM_ARCHITECTURE.md` §4: a `Job` table in Prisma, drained by a scheduled Route Handler (Amplify/EventBridge-triggered cron, or an external scheduled hit to a protected endpoint). **Rejected at MVP:** a hosted queue (SQS, BullMQ+Redis, Inngest/Trigger.dev-style managed queue) — these add either a new AWS service to provision and pay for, or a new external SaaS credential, before job volume (a handful of AI generations and document-processing jobs per organization session) comes anywhere near justifying dedicated queue infrastructure. Next.js on Amplify is not a natural fit for a long-running worker process anyway (serverless function execution model), so a scheduled-drain pattern fits the hosting model better than assuming a worker fleet exists. This is explicitly a "revisit later" decision, not a permanent architectural stance — see `SYSTEM_ARCHITECTURE.md` §4's extraction path to SQS if volume grows.

---

## 8. Testing: Vitest + React Testing Library + Playwright

**Recommendation:**
- **Vitest** for unit/integration tests (business logic in `lib/modules/**` and `lib/core/**` — especially the deterministic scoring engines in `AI_ARCHITECTURE.md` §3, which most need reproducible test coverage) and **React Testing Library** for component tests. Vitest over Jest specifically because it's faster and has simpler ESM/TypeScript config out of the box, which matters for a small team that doesn't want to spend setup time tuning a Jest+ts-jest+ESM config; either would technically work, but Vitest is the lower-friction default for a Next.js 14/TS project starting testing from zero today.
- **Playwright** for end-to-end tests of critical authenticated flows (login → onboarding → dashboard; a Compliance workflow item lifecycle; a partner introduction request) — chosen over Cypress for its built-in multi-browser support and generally lower flake rate, and because it's a common pairing with Vitest in the current Next.js ecosystem.
- Given MVP scope and team size, testing investment should prioritize: (1) the deterministic scoring/rules engines (highest consequence of a silent bug, per `AI_ARCHITECTURE.md`), (2) tenant-isolation/authorization logic (highest security consequence, per `SECURITY_ARCHITECTURE.md`), and (3) a thin layer of e2e smoke tests over the critical path — not exhaustive coverage of every UI permutation on day one.

---

## 9. Linting/formatting: ESLint (existing) + Prettier

ESLint with `eslint-config-next` is already configured and should continue unchanged as the lint baseline (add rules for the new platform code as needed, e.g., an import-boundary rule enforcing the module separation in `SYSTEM_ARCHITECTURE.md` §1, if the team wants it enforced mechanically rather than by convention). **Add Prettier** for formatting — it isn't currently configured, and a shared formatter is close to zero-cost to add (one config file, an `.prettierrc`, optionally `eslint-config-prettier` to avoid rule conflicts) and removes an entire class of PR review noise ("nit: formatting") for a team that will be moving fast across many new files.

---

## 10. CI/CD: lint + test gate before the existing Amplify build

The existing deployment is AWS Amplify per `amplify.yml` (`preBuild: npm ci`, `build: npm run build`, artifacts from `.next`). **Recommendation: keep Amplify as the deployment mechanism (do not introduce a separate deploy pipeline), but add a lightweight CI gate — GitHub Actions running `npm ci && npm run lint && npm run test` (and `npx tsc --noEmit` for a type-check pass) — on pull requests, before merge, separate from Amplify's own build.** Amplify's build step is deploy-time (build the artifact and ship it); it is not a substitute for a pre-merge quality gate, since a broken lint/test doesn't necessarily fail `next build`. Concretely: add `npm run test` (Vitest) and keep `npm run lint` (already present) as `package.json` scripts, add a minimal `.github/workflows/ci.yml` that runs on PRs against `main`, and leave `amplify.yml` itself unchanged — Amplify continues to build and deploy on push to the connected branch exactly as it does today, now with more confidence that what merged already passed lint/tests. This is a one-file addition, appropriate for a small team, not a heavyweight multi-stage pipeline.

---

## 11. Summary table

| Concern | Choice | Status |
|---|---|---|
| Framework | Next.js 14 App Router + TypeScript | Keep (existing) |
| Styling (marketing site) | Existing custom CSS | Untouched |
| Styling (platform) | Tailwind CSS, scoped to platform routes | New |
| ORM | Prisma | New |
| Database (local) | SQLite | New — no credentials needed |
| Database (staging/prod) | PostgreSQL (e.g., AWS RDS/Aurora Serverless) | New — **requires credentials** |
| Auth | NextAuth.js (Auth.js) + Prisma adapter | New |
| File storage | AWS S3 | New — **requires credentials** |
| Background jobs | Prisma `Job` table + scheduled Route Handler | New |
| Unit/integration testing | Vitest + React Testing Library | New |
| E2E testing | Playwright | New |
| Linting | ESLint (`eslint-config-next`) | Keep (existing) |
| Formatting | Prettier | New |
| CI | GitHub Actions (lint + typecheck + test on PR) | New |
| Deployment | AWS Amplify (`amplify.yml`, unchanged) | Keep (existing) |
| Email | AWS SES | Keep (existing), extended to platform notifications |
