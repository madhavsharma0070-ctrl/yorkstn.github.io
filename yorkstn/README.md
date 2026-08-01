# Yorkstn

Next.js 14 (App Router) application containing both the Yorkstn marketing site and the Yorkstn platform — the Market Entry Operating System described in the repo-root `README.md`.

**Status: MVP complete and demo-ready.** All 4 core modules (AI Market Intelligence, Compliance Operating System, Partner Discovery Platform, Retail Expansion Intelligence) plus Managed Services and cross-cutting hardening are built and verified. See `../PROJECT_MEMORY.md` and `../CHANGELOG.md` for full status.

## Running it locally

```bash
npm install
cp .env.local.example .env   # then edit as needed — defaults below work out of the box
npx prisma migrate dev       # creates/updates the local SQLite database
npm run db:seed              # loads demo org, users, cities, partners (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing site, or [http://localhost:3000/app/login](http://localhost:3000/app/login) to sign in to the platform directly.

## Environment variables

Copy `.env.local.example` to `.env` (or `.env.local`) and adjust as needed. Local development requires **zero external credentials** — everything below defaults to a local/mock implementation:

| Variable | Local dev default | Notes |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite locally; point at Postgres for staging/production (`docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8). |
| `NEXTAUTH_SECRET` | a dev-only placeholder | Generate a real value (`openssl rand -base64 32`) for anything beyond local dev. |
| `NEXTAUTH_URL` | `http://localhost:3000` | |
| `AI_PROVIDER` | `mock` | Deterministic, fully functional AI Output Standard behavior with no LLM key. Set to `anthropic` + provide `ANTHROPIC_API_KEY` for real generative output (untested against a real key in this environment). |
| `DOCUMENT_STORAGE_PROVIDER` | `local` | Writes to a gitignored `.local-storage/` directory. Set to `s3` + provide AWS credentials/bucket for production. |

`AWS_*` variables are also used by the existing marketing-site contact form (`app/api/enquiry/route.ts`) and can be reused to extend platform notifications to email later — not required to run the app.

## Database

- **Migrate:** `npx prisma migrate dev` (creates the SQLite file and applies all migrations).
- **Seed:** `npm run db:seed` (runs `prisma/seed.ts`) — also run automatically by `prisma migrate reset`.
- **Inspect:** `npm run db:studio` opens Prisma Studio against the local database.

The dev database (`prisma/dev.db`) is gitignored and local-only — never a shared or production database.

## Demo login credentials

`npm run db:seed` creates one demo organization, **Acme Kids Apparel (Demo)**, and the following users. All brand-side and staff accounts share the password `password123`.

| Email | Role |
|---|---|
| `priya.owner@demo.yorkstn.com` | Owner |
| `admin@demo.yorkstn.com` | Admin |
| `arjun.compliance@demo.yorkstn.com` | Compliance Manager |
| `meera.analyst@demo.yorkstn.com` | Analyst/Editor |
| `viewer@demo.yorkstn.com` | Viewer (read-only) |
| `ananya.staff@yorkstn.com` | Yorkstn Staff (platform admin) |
| `rohan.partner@demo.yorkstn.com` | Partner (partner-portal login) |

Sign in for the brand roles and staff at `/app/login`; the partner account signs in through the same login page and lands in the separate partner portal (`/partner-portal`).

## Module map

| Module | UI | API |
|---|---|---|
| Dashboard (composed cross-module summary) | `/app/dashboard` | `/api/v1/dashboard` |
| AI Market Intelligence | `/app/market-intelligence` | `/api/v1/market-intelligence/**` |
| Compliance Operating System | `/app/compliance/**` | `/api/v1/compliance/**` |
| Partner Discovery Platform | `/app/partners/**`, `/app/admin/partner-verification`, `/partner-portal/**` | `/api/v1/partners/**`, `/api/v1/partner-portal/**`, `/api/v1/admin/partner-verification-queue` |
| Retail Expansion Intelligence | `/app/expansion/**` | `/api/v1/expansion/**` |
| Managed Services | `/app/managed-services`, `/app/admin/managed-services` | `/api/v1/managed-services/**`, `/api/v1/admin/managed-services/**` |
| Org settings, members, audit log | `/app/settings/**` | `/api/v1/organizations/**`, `/api/v1/invitations/**` |

## Testing and CI

```bash
npm run lint
npm test        # Vitest — deterministic/pure-function unit tests, no DB required
npm run build
```

The same three commands run automatically in GitHub Actions on every push/PR (`.github/workflows/ci.yml`), with zero repository secrets required.

## Project structure notes

- `app/(marketing)/**` — the existing marketing site (unchanged bespoke design; do not restyle).
- `app/(platform)/app/**` — the brand-facing platform (its own root layout, independent of the marketing site).
- `app/(platform)/partner-portal/**` — the partner-facing portal (also its own root layout).
- `lib/modules/**` — one directory per module; cross-module reads only ever go through another module's exported functions, never a raw query into its tables.
- `prisma/schema.prisma` — the full data model, all modules.

For the full project history, architecture decisions, and current status, see the repo-root `README.md`, `PROJECT_MEMORY.md`, `CHANGELOG.md`, `TODO.md`, and `DECISIONS.md`.
