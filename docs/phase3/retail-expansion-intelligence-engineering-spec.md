# Engineering Spec — Retail Expansion Intelligence Module

**Depends on:** `docs/phase2/FEATURE_SPECIFICATIONS.md` §Module 4, `docs/phase2/DATABASE_SCHEMA.md` §1.6, `docs/phase2/API_SPECIFICATION.md` §6, `docs/phase2/MVP_ROADMAP.md` (Milestone 7 — deliberately last, aggregating module).

## 1. Module boundary

```
lib/modules/expansion/
├── content/
│   ├── city-intelligence.service.ts   # read-mostly; reads market-intelligence's competitor data (read boundary call, not raw query)
│   └── mall-intelligence.service.ts
├── site-selection/
│   ├── scoring-engine.ts              # pure function: (site attributes, weights) => { computedScore, scoreBreakdown } — deterministic, mirrors readiness-score's purity rule
│   └── site.service.ts                # CRUD over sites, optional cre_partner_id link into Partner Discovery
├── roadmap/
│   ├── roadmap.service.ts             # 5-phase sequenced plan (entity_formation -> compliance -> partner_selection -> site_selection -> launch)
│   └── milestone-auto-sync.ts         # updates roadmap_milestones.status by reading linked_entity_type/linked_entity_id state from Compliance/Partners (read boundary calls)
├── financial-projections/
│   └── projection.service.ts          # keeps user_assumptions and platform_benchmarks as visually/structurally separate fields, never merged (US-44)
├── launch-tasks.service.ts
└── dashboard-aggregation.service.ts   # the ONE service allowed to read across all 4 modules — see §4

app/app/expansion/**
app/api/v1/expansion/**
app/api/v1/dashboard  # owned here even though it aggregates every module, since it's fundamentally an Expansion Dashboard concept (PRD §5.4)
```

## 2. Prisma models owned

`cities`, `malls`, `sites`, `site_scoring_configs`, `expansion_roadmaps`, `roadmap_milestones`, `financial_projections`, `financial_projection_line_items`, `launch_tasks` (per `DATABASE_SCHEMA.md` §1.6). `cities`/`malls` are shared reference tables (not tenant-scoped, like `partners` — per `DECISIONS.md` D-14) — every other table in this list is `organization_id`-scoped.

## 3. API routes owned

The full `/expansion/**` group and `/dashboard` from `API_SPECIFICATION.md` §6.

## 4. This module is the one place cross-module reads are the *primary* job, not an exception

Every other module's spec treats a cross-module read as a narrow, named exception (Pricing Intelligence reading duty data; GST reading site footprint). This module's `dashboard-aggregation.service.ts` is different in kind: its entire job is to compose Readiness Score (Market Intelligence), open Compliance items (Compliance OS), introduction-request status (Partner Discovery), and roadmap progress (its own module) into one response, per `FEATURE_SPECIFICATIONS.md` §4.7 and AC US-46. **Implementation rule:** it still does this exclusively through each module's exported read-only query functions (never raw Prisma joins across module boundaries) — the aggregation is orchestration, not a shortcut around the module-boundary discipline `SYSTEM_ARCHITECTURE.md` §1 establishes. This keeps the option open to extract Market Intelligence or Partner Discovery into a separate service later (per D-06's stated extraction path) without rewriting the dashboard.

## 5. The Financial Projections separation rule (implementation of a specific acceptance criterion)

`projection.service.ts` must return `userAssumptions` and `platformBenchmarks` as two distinct top-level object keys in every API response and never compute a single blended "projected revenue" number server-side that discards which parts were user-entered vs. platform-sourced — the UI is responsible for presenting them side-by-side per `UI_UX_WIREFRAMES.md`, but the *data shape* enforcing that separation lives here, so a future UI change can't accidentally blend them either. This is a direct implementation of AC US-44 and the PRD's non-goal against presenting speculative financials as fact.

## 6. Site scoring determinism

`site-selection/scoring-engine.ts` follows the identical purity contract as the Readiness Score and Entity Formation rules engine (no I/O, versioned if the scoring formula changes, same inputs → same `computedScore`/`scoreBreakdown` always) — the third and final instance of the deterministic-feature pattern established in `DECISIONS.md` D-04, now applied consistently across all three modules that have one (Market Intelligence, Compliance, Expansion).

## 7. Test plan

- **Unit:** `scoring-engine.ts` determinism test (weights + site attributes → reproducible score); `milestone-auto-sync.ts` — a fixture where a linked Compliance workflow item transitions to `completed` correctly flips the corresponding `roadmap_milestones.status`.
- **Integration:** `dashboard-aggregation.service.ts` — single test asserting the composed response contains all four expected sections and that RBAC-appropriate data is returned per role (a `viewer` gets read-only data, not missing sections).
- **Integration:** Financial Projections API contract test asserting `userAssumptions`/`platformBenchmarks` are always present as separate keys, even when one is empty (never omitted or merged).

## 8. Build-order note

Milestone 7, deliberately last among the four modules per `MVP_ROADMAP.md` — it has a real dependency on Milestones 2–3 (Compliance), 5 (Market Intelligence's Readiness Score/City Recommendations), and 6 (Partner Discovery's introduction-request status) all existing first, since its defining feature (the Expansion Dashboard) has nothing meaningful to aggregate otherwise. City/Mall Intelligence detail pages and the Site Selection workspace can be built and demoed earlier against seed data alone if useful for incremental delivery, but the Dashboard itself should not be considered "done" (per `MILESTONES.md` Milestone 7's DoD) until the modules it reads from are real.
