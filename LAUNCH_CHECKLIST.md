# Yorkstn — Launch Checklist

**Purpose:** a single, accurate reference for taking Yorkstn from "MVP complete in this repo" to (a) a local demo, (b) a separate hosted demo site, and (c) a real production launch. Everything below was verified directly against the current repository — actual code, actual `package.json` scripts, actual `.env.local.example`, actual Prisma schema — not assumed from the design docs alone. Where the design docs (`docs/phase2/DEPLOYMENT_ARCHITECTURE.md`, `SECURITY_ARCHITECTURE.md`) describe something that isn't actually built yet, that gap is called out explicitly rather than glossed over.

No files were changed and nothing was deployed to produce this document.

---

## 1. Everything required to run the demo locally

This is already fully supported by the repo — no new accounts, no real credentials, no code changes.

1. Node.js 20 (the version CI and this checklist assume — see §10 for why).
2. `cd yorkstn && npm install`
3. Copy `yorkstn/.env.local.example` to `yorkstn/.env` (see §4 for what each variable means — the example file's defaults work with zero edits for local use).
4. `npx prisma migrate dev` — creates `yorkstn/prisma/dev.db` (SQLite) and applies all 3 committed migrations.
5. `npm run db:seed` — loads the demo organization, 7 demo users, reference cities/malls, and sample partners.
6. `npm run dev` — starts the app at `http://localhost:3000`.
7. Sign in at `http://localhost:3000/app/login` with any credential from §8's login table.

Everything (all 4 modules + Managed Services + audit log) works end-to-end at this point, on mock AI output and local file storage.

## 2. Everything required to deploy a separate demo website

A **separate demo website** means: a second, isolated deployment of this same app — its own URL, its own database, fully independent of any future production deployment — so it can be shared without touching real infrastructure. The repo's own architecture doc (`DEPLOYMENT_ARCHITECTURE.md` §2) is explicit that the platform is *not* a second codebase or a second build pipeline — it's the same Next.js app the marketing site already uses, just pointed at different environment variables. That's what makes a demo deployment realistic to stand up quickly.

**What's needed, beyond local dev:**

1. A hosting target that can run a Next.js app. The proven path already in this repo is **AWS Amplify** (`amplify.yml` exists and already builds this app for the marketing site — appRoot `yorkstn`, `npm ci && npm run build`). A second Amplify "app" (or a second branch/environment on the existing Amplify app, per `DEPLOYMENT_ARCHITECTURE.md` §1) pointed at a demo branch is the least-new-surface-area option. Any other Next.js-capable host (Vercel, Render, Railway, etc.) would also work but has not been tested against this repo — treat that as new, unverified ground if chosen instead of Amplify.
2. A database reachable from that host. **Important, verified gap:** `prisma/schema.prisma` has `provider = "sqlite"` hardcoded in its `datasource` block. SQLite is a local file — it does not survive redeploys or cold starts on most managed hosting (including Amplify's default compute), so a hosted demo cannot simply reuse the local `DATABASE_URL="file:./dev.db"` setup. Getting a *reliably working* hosted demo means either:
   - **(a)** provisioning a small managed Postgres instance (a free/low-cost tier from a provider like Neon, Supabase, or RDS is enough for a demo) and changing `schema.prisma`'s `provider` from `"sqlite"` to `"postgresql"`, then regenerating migrations against Postgres (SQLite and Postgres migration SQL are not interchangeable) — this is a real code/schema change, not just an environment variable; **or**
   - **(b)** accepting that a SQLite-backed demo may reset/lose data unpredictably between deploys, which is fine for a short-lived, throwaway demo link but should be communicated to whoever's viewing it.
3. A demo-specific `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (the demo's own domain).
4. `AI_PROVIDER=mock` and `DOCUMENT_STORAGE_PROVIDER=local` are fine to keep for a demo — no reason to provision a real LLM key or S3 bucket just to demo the product. **Same filesystem-persistence caveat as the database applies to local document storage** (`.local-storage/`) on most hosts — uploaded demo documents may not survive a redeploy.
5. Run the seed script once against the demo database (`npm run db:seed`) after the first deploy so the demo has the same login credentials as local dev.

## 3. Everything required for a real production launch

Beyond everything in §2, done for real rather than for a throwaway demo:

1. **Production Postgres** — a real managed instance (not the demo one), with `schema.prisma`'s provider switched to `postgresql` (one-time, shared with the demo-hardening work in §2).
2. **Production S3 storage — with real engineering work, not just a bucket.** Verified in code: `lib/modules/compliance/documents/storage.adapter.ts`'s `S3StorageAdapter` is a stub — both its `save()` and `read()` methods currently just `throw new Error(...)`. Setting `DOCUMENT_STORAGE_PROVIDER=s3` today does not partially work with a bucket plugged in — it breaks document upload outright until someone writes the actual S3 integration. This is the single largest piece of real engineering work standing between "MVP" and "production," and it is **not** captured by "provision a bucket."
3. **A real `NEXTAUTH_SECRET`**, generated fresh for production (`openssl rand -base64 32`), never reused from local/demo.
4. **A real LLM key**, if AI-generated narrative output (not just the mock provider's deterministic output) is wanted for launch. Verified in code: `ClaudeAiProvider` (`lib/modules/market-intelligence/ai-provider/claude-provider.ts`) is a complete, real implementation against Anthropic's Messages API — but it has never been run against a live key in this environment. Budget time to actually test it before trusting its output shape in front of a real customer, not just to acquire the key.
5. **AWS SES out of sandbox, with a verified sending identity.** Verified in code: `app/api/enquiry/route.ts` sends from a hardcoded `connect@yorkstn.com` address to a hardcoded internal recipient list. For this to work in production, that sender address/domain must be a verified SES identity, and the SES account must be moved out of sandbox mode (sandbox SES can only send to pre-verified recipient addresses, which defeats the point of a public contact form).
6. **Rate limiting — recommended in `SECURITY_ARCHITECTURE.md` §8, not implemented anywhere in code.** Verified: no rate-limiting code exists in the repo at all. Login, the contact/introduction-request flow, and AI-generation endpoints are all currently unprotected against abuse/brute-force. This should be built before real public traffic, not treated as optional polish.
7. **Malware scanning on uploaded documents — flagged in `SECURITY_ARCHITECTURE.md` §6 as "requires further validation," not implemented.** Today, uploads are only checked for file type/size (`lib/modules/compliance/documents/versioning.service.ts`), with no scanning for malicious content. Acceptable to launch without it only if this gap is a conscious, documented decision, not an oversight.
8. **Error tracking (Sentry or equivalent) — verified absent from the codebase entirely.** No Sentry package is installed, no initialization code exists anywhere. This is pure greenfield work (SDK install + init + DSN), not a "flip a switch" item.
9. **Primary-source re-verification** of the Phase 1 regulatory research (`docs/phase2/VALIDATION_PLAN.md` §4) before any of it is presented to a real customer as authoritative compliance guidance — this is a research/legal-review task, not an engineering one.
10. **A production domain + DNS**, pointed at whichever hosting choice was made in §2/§3.

## 4. Exact environment variables needed (names only — no values)

### Actually read by the platform's code today

| Variable | Read by | Purpose |
|---|---|---|
| `DATABASE_URL` | Prisma (`lib/db.ts`, all modules) | Database connection string |
| `NEXTAUTH_SECRET` | NextAuth.js (`auth.ts`) | Signs session JWTs |
| `NEXTAUTH_URL` | NextAuth.js | The app's own base URL |
| `AI_PROVIDER` | `lib/modules/market-intelligence/ai-provider/index.ts` | `mock` or `anthropic` |
| `ANTHROPIC_API_KEY` | `claude-provider.ts` | Only read/required when `AI_PROVIDER=anthropic` |
| `DOCUMENT_STORAGE_PROVIDER` | `storage.adapter.ts` | `local` or `s3` (`s3` currently throws — see §3.2) |

### Used by the existing marketing site (unrelated to the platform, but shared by the same deployment)

| Variable | Read by | Purpose |
|---|---|---|
| `AWS_REGION` | `app/api/enquiry/route.ts` | SES region for the contact form |
| `AWS_ACCESS_KEY_ID` | `app/api/enquiry/route.ts` | SES credentials |
| `AWS_SECRET_ACCESS_KEY` | `app/api/enquiry/route.ts` | SES credentials |
| `NEXT_PUBLIC_GA_ID` | Marketing site | Google Analytics ID |

### Documented as future/planned, but verified NOT read by any code yet

| Variable | Status |
|---|---|
| `DOCUMENT_STORAGE_S3_BUCKET` | Listed as a commented-out placeholder in `.env.local.example`; no code anywhere actually reads it — the S3 adapter is a stub (§3.2), so there's nothing yet to configure a bucket name *for*. |
| `SENTRY_DSN` | Mentioned in `DEPLOYMENT_ARCHITECTURE.md` §4/§7 as a future addition; no Sentry package or init code exists in the repo at all. |

No actual secret values appear anywhere in this document or the repo's tracked files — the working `.env` is git-ignored (`yorkstn/.gitignore`).

## 5. Services/accounts you need to create

Only needed for demo hosting (§2) or production (§3) — none of these are needed to run the demo locally (§1).

| For | Account/service |
|---|---|
| Hosting a separate demo | AWS account with Amplify access (reusing the existing one this repo already deploys the marketing site from is simplest) |
| Demo or production database | A managed Postgres provider (e.g., Neon, Supabase, or AWS RDS) |
| Production only | A second, separate managed Postgres instance from the demo's (don't share one database between demo and production) |
| Production file storage | AWS S3 (a bucket + a scoped IAM user/role) — needed once the S3 adapter is actually built (§3.2) |
| Production email | Confirm/extend the existing AWS SES setup already used for the contact form; move it out of sandbox mode |
| Real AI narrative generation (optional) | An Anthropic account + API key |
| Error tracking (recommended before public launch) | A Sentry account (or equivalent) |
| Domain (production) | Whoever currently holds the `yorkstn` domain/DNS |

## 6. Steps you must perform manually

These require a human with account access — I cannot do them:

- Creating/logging into the AWS account and any new services under it (Amplify app, RDS/Postgres, S3 bucket, IAM credentials, SES domain verification and sandbox exit).
- Creating an Anthropic account and generating an API key, if real AI output is wanted.
- Creating a Sentry account and project.
- Purchasing/configuring DNS for a production domain.
- Actually pasting real secret values into Amplify's environment variable settings (or wherever they're hosted) — I will never ask you to paste secrets into this chat, and I have no way to do this step for you regardless.
- The primary-source legal/regulatory re-verification in §3.9 — this needs a person (ideally with Indian legal/CA input), not code.
- The final decision on which hosting provider to use for a separate demo, and whether to accept the SQLite/local-storage persistence tradeoff in §2 or do the Postgres migration first.

## 7. Steps that can be automated through code or configuration

Once you've made the decisions in §6, these are implementation work I (or any engineer) can do directly in the repo — no account access required to write the code itself, only to test it against real credentials afterward:

- Switching `schema.prisma`'s `datasource` provider from `sqlite` to `postgresql` and generating a fresh Postgres-targeted migration.
- Implementing the real `S3StorageAdapter` (§3.2) once a bucket exists to test against.
- Adding rate limiting to the auth, introduction-request, and AI-generation routes (§3.6).
- Installing and wiring up the Sentry SDK (§3.8) once a DSN exists.
- Wiring `AI_PROVIDER=anthropic` end-to-end and fixing whatever the first real test run against `ClaudeAiProvider` surfaces (§3.4).
- Updating `amplify.yml` (or equivalent config for a different host) to run `prisma migrate deploy` as a build step, per `DEPLOYMENT_ARCHITECTURE.md` §5's recommendation — not currently in `amplify.yml` today.
- Any documentation updates these changes imply.

## 8. Testing checklist

All demo credentials below are seeded by `npm run db:seed` (`yorkstn/prisma/seed.ts`) — every account shares the password `password123`.

### Login & roles
- [ ] Sign in as `priya.owner@demo.yorkstn.com` (Owner) — full access everywhere.
- [ ] Sign in as `admin@demo.yorkstn.com` (Admin) — same as Owner except billing/org-deletion.
- [ ] Sign in as `arjun.compliance@demo.yorkstn.com` (Compliance Manager) — can edit Compliance, cannot edit Expansion/Partners-introduce.
- [ ] Sign in as `meera.analyst@demo.yorkstn.com` (Analyst/Editor) — can edit Expansion and introduce Partners, cannot edit Compliance.
- [ ] Sign in as `viewer@demo.yorkstn.com` (Viewer) — read-only everywhere; every edit action should be blocked.
- [ ] Sign in as `ananya.staff@yorkstn.com` (Yorkstn Staff, platform admin) — lands outside the brand org context; can access `/app/admin/**` pages.
- [ ] Sign in as `rohan.partner@demo.yorkstn.com` (Partner) — lands in the separate partner portal, not the brand app.
- [ ] Confirm a Viewer gets blocked (not just hidden buttons) when attempting an edit action directly.

### Dashboard
- [ ] `/app/dashboard` loads and shows a real Readiness Score, real open Compliance items, real Partner introduction counts, and real Roadmap progress — not placeholder dashes.

### AI Market Intelligence ("practice mode" = the mock provider)
- [ ] Visit `/app/market-intelligence`, generate each of the 6 features (market analysis, consumer insights, competitors, pricing, demand forecast, city recommendations).
- [ ] Confirm each result shows a confidence label and sources (or an honest "insufficient data" state rather than fabricated content).
- [ ] Recalculate the Expansion Readiness Score and confirm the driver breakdown adds up.

### Compliance Operating System
- [ ] `/app/compliance/entity-formation` — submit the questionnaire, confirm a recommendation and checklist tasks appear.
- [ ] `/app/compliance/import`, `/gst`, `/bis`, `/trademark` — each loads and lets a permitted role add/update items.
- [ ] Upload a document to a workflow item; confirm it's stored and re-downloadable.
- [ ] Confirm `/app/compliance` (the overview) shows a combined timeline across all workflow types.

### Partner Discovery
- [ ] `/app/partners` — search/filter the directory, request an introduction.
- [ ] Sign in as the partner account, respond to the introduction request from the partner portal.
- [ ] As staff, review and decide a pending partner-verification submission at `/app/admin/partner-verification`.

### Retail Expansion Intelligence
- [ ] `/app/expansion/cities` and a city detail page — confirm real seeded city/mall data renders.
- [ ] `/app/expansion/sites` — add a candidate site, change scoring weights, confirm scores recompute.
- [ ] `/app/expansion/financial-projections` — create a projection, confirm assumptions and platform benchmarks stay visually separate.
- [ ] `/app/expansion/launch-tasks` — create and complete a task.
- [ ] `/app/expansion` (roadmap) — confirm milestone status reflects the actions above (e.g., adding a site should move Site Selection off "not started").

### Managed Services
- [ ] From a Compliance workflow item, use "Get expert help" to request an engagement.
- [ ] As staff (platform admin), assign yourself to the request at `/app/admin/managed-services`.
- [ ] Post a status update as staff; confirm it's visible immediately on the brand side.
- [ ] Confirm a second, unassigned staff account (if you create one for testing) is blocked from updating an engagement assigned to someone else.

### Audit log
- [ ] As Owner/Admin, visit `/app/settings/audit-log` and confirm recent actions above appear with the correct actor.
- [ ] As a non-Owner/Admin role, confirm the audit log is inaccessible.

### File handling
- [ ] Upload an allowed file type (PDF/DOCX/PNG/JPG) to a Compliance workflow item — confirm success.
- [ ] Attempt an unsupported file type — confirm a clear rejection, not a silent failure.
- [ ] Confirm an uploaded file can be retrieved/downloaded again afterward.

## 9. Order of operations for a complete beginner

1. Get the code running locally first (§1) — do this before anything else, so you know what a working system looks like.
2. Log in as each role once and click around (§8) — get familiar with the product before touching infrastructure.
3. Decide: do you want a quick, throwaway demo link, or are you heading toward a real launch? This determines whether you can skip the Postgres/S3 work for now.
4. If a demo link: pick a host (Amplify is the path already proven by this repo), create the AWS account/access if you don't have it, and accept the SQLite/local-storage caveat in §2 for a first pass — or do the Postgres switch now if you want the demo to be reliable over time.
5. If heading toward production: work through §3 in roughly this order — production database first (everything else depends on data persisting), then real file storage (§3.2, the biggest engineering item), then the security items (§3.6, §3.7), then error tracking (§3.8), then the real AI key (§3.4) last, since the product is already fully demoable on the mock provider.
6. At each infrastructure step, come back and ask me to do the corresponding code work from §7 — I'll need to know which service you set up before I can wire the code to it, but I never need the actual secret values typed into chat, only confirmation that a variable has been set in your hosting provider's environment settings.
7. Re-run the §8 testing checklist against the new environment before calling it done — passing locally doesn't guarantee it works against a new database/host.

## 10. Blockers, warnings, and missing documentation

**Real blockers (not just "needs a credential"):**
- `S3StorageAdapter` is an unimplemented stub that throws on every call (§3.2) — this is the single biggest gap between demo and production.
- `schema.prisma` is hardcoded to `sqlite` — moving to Postgres is a schema change + fresh migration, not an env var flip (§2, §3.1).
- No rate limiting exists anywhere in the code, despite being recommended in `SECURITY_ARCHITECTURE.md` §8 (§3.6).
- No malware scanning exists on uploaded documents, a gap the security doc itself flags as needing external validation (§3.7).
- No error tracking (Sentry or otherwise) is wired up at all (§3.8).

**Warnings:**
- Local file storage (`.local-storage/`) and SQLite both depend on a persistent local filesystem — most managed/serverless hosts don't guarantee this across deploys or restarts. A hosted demo on local storage may silently lose data.
- `amplify.yml` does not currently run `prisma migrate deploy` as a build step — `DEPLOYMENT_ARCHITECTURE.md` §5 recommends adding it once there's a real staging/production database, but it isn't there today, so a naive Amplify deploy against a fresh Postgres database would build the app without ever creating its tables.
- The contact-form SES integration sends from and to hardcoded addresses in code (`connect@yorkstn.com` and two personal Gmail addresses) — worth revisiting before this is a real customer-facing form, independent of the platform work.

**Missing/incomplete documentation, found while writing this checklist:**
- `.env.local.example` lists `DOCUMENT_STORAGE_S3_BUCKET` as if it's an active configuration option; it's currently inert (no code reads it) because the S3 adapter isn't built. Worth a comment update once the adapter exists, to avoid a future reader thinking it already works.
- Neither `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` nor any README currently states, in one place, that the S3 adapter is a stub rather than "not yet configured" — the distinction matters and this document is the first place it's stated plainly.

---

*This document reflects the repository as of the MVP-complete state (all 8 milestones shipped — see `PROJECT_MEMORY.md`, `CHANGELOG.md`). It describes what to do next; it does not itself change any code or infrastructure.*
