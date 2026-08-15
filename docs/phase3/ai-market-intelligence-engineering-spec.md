# Engineering Spec — AI Market Intelligence Module

**Depends on:** `docs/phase2/FEATURE_SPECIFICATIONS.md` §Module 1, `docs/phase2/AI_ARCHITECTURE.md`, `docs/phase2/DATABASE_SCHEMA.md` §1.3, `docs/phase2/API_SPECIFICATION.md` §3, `docs/phase2/MVP_ROADMAP.md` (Milestones 4–5).
**Purpose of this document:** go one level deeper than Phase 2's system-wide docs into this module's internal code structure, exact model/route ownership, and its test plan — not to re-derive or contradict Phase 2's decisions.

## 1. Module boundary (modular monolith placement)

```
lib/modules/market-intelligence/
├── ai-provider/                 # provider-agnostic interface (shared with Partner module — see §2)
│   ├── types.ts                 # AiOutput envelope type (summary/confidence/sources/assumptions/generatedAt/modelVersion)
│   ├── mock-provider.ts         # default MVP implementation — deterministic, seed-corpus-driven
│   └── claude-provider.ts       # documented drop-in, inactive unless ANTHROPIC_API_KEY is set (D-11)
├── retrieval/
│   ├── corpus-index.ts          # RAG retrieval over research/*.md + seeded category/city content
│   └── source-citation.ts       # extracts/normalizes sources[] from retrieval hits into ai_insight_sources rows
├── insights/
│   ├── market-analysis.service.ts
│   ├── consumer-insights.service.ts
│   ├── competitor-intelligence.service.ts
│   ├── pricing-intelligence.service.ts     # reads compliance duty/HSN data cross-module (read-only)
│   └── demand-forecast.service.ts          # enforces the "proxy-based" methodology label, US-14
├── city-recommendations.service.ts
└── readiness-score/
    ├── scoring-engine.ts         # pure function: (inputs) => { totalScore, drivers[] } — deterministic, unit-testable in isolation
    └── inputs-collector.ts       # gathers compliance-completion %, market-review flags, capital questionnaire

app/app/market-intelligence/**    # UI routes per docs/phase2/INFORMATION_ARCHITECTURE.md §1
app/api/v1/market-intelligence/** # route handlers, thin — call into lib/modules/market-intelligence/* only
```

**Cross-module read dependency:** Pricing Intelligence and the Readiness Score both read from the Compliance module (duty/HSN data; compliance-completion %). This is implemented as a direct function call into `lib/modules/compliance/`'s exported read-only query functions (e.g., `getComplianceCompletionSummary(organizationId)`), **never** a raw cross-module Prisma query from within `market-intelligence/` — this is the internal module-boundary discipline `SYSTEM_ARCHITECTURE.md` §1 calls "clean internal module boundaries," and is what makes future extraction (if a module ever needs to become a separate service) possible without an untangling rewrite.

## 2. The `AiProvider` interface (shared infrastructure, owned by this module, consumed by Partner Discovery too)

```ts
interface AiProvider {
  generate(request: {
    category: AiInsightCategory | 'partner_recommendation';
    inputParams: Record<string, unknown>;
    retrievalContext: RetrievalHit[];
  }): Promise<AiOutput>;
}
```
- `mock-provider.ts` is the MVP default (Milestone 4, `docs/phase2/MVP_ROADMAP.md`): deterministic — same `inputParams` always produce the same `AiOutput` (important for demo repeatability and for testing downstream UI without network flakiness). It synthesizes `summary`/`structured_output` from the seeded corpus and always populates `sources[]` from whatever it actually read, never inventing a citation — if the seed corpus has nothing relevant, it returns `confidence: 'insufficient_data'` rather than fabricating content, mirroring the project's own Phase 1 research discipline inside the product itself.
- `claude-provider.ts` implements the same interface against the Claude API, selected via `AI_PROVIDER=anthropic` env var (`docs/phase2/DEPLOYMENT_ARCHITECTURE.md` §8). Because both providers satisfy the same interface and output shape, no downstream code (routes, UI, tests) needs to know which is active.

## 3. Prisma models owned

`brand_profiles`, `products`, `ai_insights`, `ai_insight_sources`, `expansion_readiness_scores`, `readiness_score_drivers` (per `DATABASE_SCHEMA.md` §1.2–1.3). This module has **write** ownership of these tables; other modules may **read** `brand_profiles`/`products` (e.g., Compliance's HSN lookups read `products.hsn_code`) but must go through this module's exported read functions, not direct Prisma access, per §1's boundary rule.

## 4. API routes owned

Exactly the `/market-intelligence/**` route group from `docs/phase2/API_SPECIFICATION.md` §3 (market-analysis, consumer-insights, competitors, pricing, demand-forecast, cities, readiness-score) plus `/market-intelligence/partner-recommendations`'s *route* only (its underlying service lives in the Partner Discovery module per that module's spec — this route is a thin re-export, since the recommendation is inherently partner-linked data owned there, but its URL groups logically under Market Intelligence per the IA).

## 5. Determinism boundary — the one rule this module must never violate

`readiness-score/scoring-engine.ts` and any future deterministic scoring logic in this module **must be a pure function with no I/O and no call into `AiProvider`** — this is what AC US-16 actually tests (same `inputs_snapshot` → same `score`, verified by a unit test that calls the function directly with fixed inputs, not by mocking an AI response). If a future feature needs to blend a deterministic score with an AI narrative, the AI narrative is a *separate* `ai_insights` row referencing the score, never merged into the score's own computation — this mirrors `DATABASE_SCHEMA.md`'s structural separation (D-04).

## 6. Test plan

- **Unit:** `scoring-engine.ts` — deterministic-output test (same input twice → identical result); boundary tests (0 and 100 score edges); `mock-provider.ts` — output-shape conformance test (every response satisfies the `AiOutput` type, `confidence: 'insufficient_data'` case when retrieval is empty).
- **Integration (route-level):** one test per `/market-intelligence/**` endpoint asserting response shape matches `API_SPECIFICATION.md` §3's example, and RBAC rejection for `viewer` on `.../generate` POST endpoints (per `AUTH_RBAC.md` §2 — Market Intelligence regeneration excludes `viewer`).
- **Cross-module:** a test asserting Pricing Intelligence's response changes appropriately when the org's Compliance duty data changes (proves the read-boundary function is actually wired, not stubbed).

## 7. Build-order note (ties to `MVP_ROADMAP.md`)

This module is Milestone 5, gated on Milestone 4 (AI service layer must exist first) and Milestones 2–3 (Readiness Score needs real Compliance-completion data, not a stubbed zero) — no new sequencing decision is made here; this section exists only to confirm Phase 3 didn't discover a reason to reorder Phase 2's plan.
