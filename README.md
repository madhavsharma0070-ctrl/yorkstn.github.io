# Yorkstn

Yorkstn is a technology-first **Market Entry Operating System** — a SaaS platform (with an optional managed-services layer) that helps international consumer brands (fashion, lifestyle, kids, beauty & personal care, home & living, specialty) launch, operate, and scale in India.

**Status: MVP complete and demo-ready.** All 8 planned build milestones have shipped, covering all 4 core modules plus Managed Services and cross-cutting hardening (audit logging, RBAC, CI). The MVP runs fully functional end-to-end on a mock AI provider, local SQLite, and local file storage — no external credentials required to run or demo it. See `PROJECT_MEMORY.md` §1 and `TODO.md` for the milestone-by-milestone status.

## The four core modules + Managed Services

1. **AI Market Intelligence** — market analysis, consumer insights, competitor intelligence, pricing intelligence, demand forecasting, city recommendations, and a deterministic Expansion Readiness Score.
2. **Compliance Operating System** — entity-formation guidance, import/customs, GST, BIS certification, and trademark/IP workflows, with document management and a cross-workflow timeline.
3. **Partner Discovery Platform** — a searchable directory of manufacturing/retail/franchise partners, a partner self-service portal, a staff verification queue, introduction requests, and AI-assisted partner recommendations.
4. **Retail Expansion Intelligence** — city and mall intelligence, deterministic site-selection scoring, an auto-synced expansion roadmap, financial projections, launch-task tracking, and a composed Expansion Dashboard.
5. **Managed Services** (cross-cutting) — in-platform requests for expert help on any Compliance task, tracked end-to-end with a Yorkstn Staff fulfillment queue and a full update history — never an off-platform channel.

Every generative feature follows one standard output shape (summary, confidence, sources, assumptions) and never fabricates data it doesn't have; every deterministic feature (readiness scoring, entity-type recommendation, site scoring, partner matching) is a pure, unit-tested function, never LLM-generated.

## Repo layout

- `yorkstn/` — the Next.js application (marketing site + the platform itself). See `yorkstn/README.md` for how to run it locally, including demo login credentials.
- `research/`, `BLUEPRINT.md` — Phase 1 market research and synthesis.
- `docs/phase2/`, `docs/phase3/` — product/architecture design docs and per-module engineering specs.

## Project tracking docs

This repo is developed with an explicit paper trail rather than relying on chat history or commit messages alone:

- **`PROJECT_MEMORY.md`** — the single source of truth for current project status; start here in any new session.
- **`CHANGELOG.md`** — what shipped, milestone by milestone, most recent first.
- **`TODO.md`** — the live action tracker: what's done, what's a non-blocking follow-up, and what's a standing pre-launch item.
- **`DECISIONS.md`** — every architecture/product decision made during the build, with rationale.

## What's left

Nothing product-related — the MVP is feature-complete against `docs/phase2/MVP_ROADMAP.md`. What remains is:
- **Non-blocking follow-ups** (e.g. wiring invitation emails through the existing SES integration instead of a copyable link) — see `TODO.md`.
- **Pre-launch infrastructure** — provisioning real production credentials (PostgreSQL, S3, a real LLM key, Sentry) per `docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8. None of these block running or demoing the MVP today.
- **Validation** — customer-discovery and design-partner-pilot work per `docs/phase2/VALIDATION_PLAN.md`, plus re-verifying Phase 1's regulatory research figures against primary `.gov.in` sources before they're surfaced as authoritative to a real customer.
