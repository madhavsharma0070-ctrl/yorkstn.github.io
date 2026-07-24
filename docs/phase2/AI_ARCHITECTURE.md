# Yorkstn — AI Architecture

**Phase:** 2 (Product & Architecture Design)
**Depends on:** `PRD.md`, `FEATURE_SPECIFICATIONS.md` (especially the AI Output Standard), `SYSTEM_ARCHITECTURE.md`
**Purpose:** Define, precisely and without hand-waving, what "AI" means for each feature that touches it — because these features span three genuinely different engineering approaches (generative+RAG, curated lookup, deterministic rules engine), and conflating them would produce an unauditable, legally risky, and factually unreliable product. This document is the single place that classification lives; `FEATURE_SPECIFICATIONS.md` cross-references it.

---

## 0. Why classification comes before implementation

Phase 1 research's "cite sources or label as assumption, never fabricate" discipline, and the PRD's explicit statement that the Expansion Readiness Score and Entity Formation recommendation are deterministic, are not stylistic preferences — they are the difference between:
- an LLM confidently inventing a BIS certification requirement that doesn't exist (a compliance and legal-consequence failure), versus
- a lookup against a versioned, "last verified" HSN-code table that either has the answer or explicitly says "insufficient data."

Every feature below is placed into exactly one of four categories. A feature is never allowed to be generative "by default" just because it involves an AI Output Standard object — the object's `summary` field can be populated by a rules engine or a lookup table just as validly as by an LLM; what varies is the mechanism producing it, and that mechanism must be named.

---

## 1. Category (a) — Foundation-model + RAG features

These are genuinely open-ended synthesis/narrative tasks where an LLM is the right tool, **but only when grounded in retrieval against a curated corpus** — never open-ended "ask the model what it knows about the Indian skincare market," which would violate the no-fabrication rule and cannot produce a real `sources[]` list.

| Feature | FEATURE_SPECIFICATIONS.md ref | What the LLM does | What is retrieved (RAG context) |
|---|---|---|---|
| Market Analysis | 1.1 | Synthesizes a narrative summary from retrieved category-market documents | Category-level market data corpus (curated from Phase 1 research + licensed data where available) |
| Consumer Insights | 1.2 | Synthesizes regional/demographic behavior narrative | City/region demographic corpus + category corpus |
| Competitor Intelligence | 1.3 | Summarizes/structures known competitor entries | Curated competitor directory (seed list per category) — see Category (b) note below: the directory itself is structured data; the LLM's job is only to phrase/aggregate it, not to recall competitors from parametric memory |
| Pricing Intelligence | 1.4 | Produces a margin-sensitivity narrative around a price range | Home-market price input + category comps + Compliance OS duty/HSN data (cross-module read) |
| Demand Forecasting narrative | 1.5 | Explains the forecast range and its proxy basis in prose | Category/city/comparable-brand proxy signal corpus |
| Partner Recommendation rationale string | 3.3 | Phrases *why* a match was made | The matching signals themselves (city match, category match, verification status) — computed deterministically (see §3), the LLM only narrates them |
| City Recommendations narrative gloss | 1.6 | Optional prose gloss on top of the per-criterion scores | City data corpus; the ranking/scores themselves are structured (§3), only the summary sentence is generative |

**Design rule for this category: retrieval-then-generate, never generate-then-hope.** The model is never given a bare question; it is given (question + retrieved passages) and instructed to answer only from those passages, attributing each claim to a passage, and to say "insufficient data" rather than fill gaps from training-data priors. This is what makes `sources[]` and `assumptions[]` in the AI Output Standard fillable with real values instead of placeholders.

### RAG structure

- **What gets indexed/embedded:** the Phase 1 research corpus (`research/*.md`) and any curated category/city/compliance content authored for MVP (the "seed dataset" referenced throughout `FEATURE_SPECIFICATIONS.md`, e.g., 1.1's category market corpus, 1.3's competitor directory, 4.1/4.2's city/mall data). Each source document is chunked (paragraph/section-level, preserving heading context) and stored with metadata: `title`, `sourceUrl` (or `internal` if it's a Yorkstn-authored seed doc), `retrievedDate` or `lastVerified`, `category`/`city`/`topic` tags for filtered retrieval.
- **Index location:** MVP does not need a dedicated vector database (Pinecone/Weaviate/etc.) — corpus size at MVP (a curated set of markdown documents per category/city, not a crawled web-scale corpus) fits comfortably in **Postgres with the `pgvector` extension**, keeping the AI layer's storage inside the same database as everything else (one fewer credential/service to provision, consistent with `SYSTEM_ARCHITECTURE.md`'s "don't add infrastructure before scale demands it" stance). Revisit only if corpus size or query-latency at scale outgrows `pgvector`.
- **Retrieval flow:** query (e.g., "market analysis for kids apparel, Tier-1 cities") → embed query → `pgvector` similarity search filtered by category/city/topic tags → top-k chunks → passed into the prompt as grounding context alongside the user/org profile inputs.
- **Chunk provenance is mandatory:** every chunk carries its source metadata through retrieval into the prompt, so the model can be instructed to cite the specific `sources[]` entries it actually used — not asked to "add sources" after the fact, which invites fabricated citations. See §5 for the concrete mechanism.

---

## 2. Category (b) — Curated/structured database, not an LLM

These features are lookups against versioned reference data. Asking an LLM to "know" this content is exactly the failure mode Phase 1 flagged (regulatory content changes fast, requires "last verified + source" tracking) — an LLM's parametric knowledge is neither current nor auditable per-fact.

| Feature | FEATURE_SPECIFICATIONS.md ref | Mechanism |
|---|---|---|
| BIS/QCO/FMCS/CRS applicability by HSN code | 2.2, 2.4 | Rules table keyed by HSN code, each row versioned with `lastVerified` date + source citation. A lookup query, not a prompt. |
| Import compliance checklist (IEC/DGFT/CBIC steps) | 2.2 | Same — structured rules table keyed by product/HSN attributes. |
| GST per-state registration requirements | 2.3 | Structured rule: "new fixed establishment in state X triggers GST registration" — a conditional lookup against organization footprint data, not generative. |
| Trademark/IP process stage definitions | 2.5 | Fixed workflow-stage reference data (search → filing → examination → publication → opposition → registration), not model output. |
| Competitor directory (underlying data) | 1.3 | The directory itself (which competitors exist, in which category) is admin-curated structured data. Only the narrative phrasing on top (Category a) is generative. |
| Mall/lease benchmark conventions (MG + revenue-share) | 4.2 | Structured reference table, admin-curated. |

**Design rule:** these live in normal Prisma-modeled tables (e.g., `ComplianceRule`, `HsnClassification`) with a `lastVerified` (date) and `sourceCitation` (text/url) column on every row, per `INFORMATION_ARCHITECTURE.md` §5's content-depth convention. The admin content-management surface (`/admin/content` per the IA) is where Yorkstn Staff update these rows; there is no LLM in this path at all, generation-time or otherwise. If a UI screen surfaces this content next to an AI Output Standard object (e.g., Import Compliance Checklist shown next to a Pricing Intelligence narrative that references duty rates), the two are rendered from two different subsystems, not merged into one model call.

---

## 3. Category (c) — Deterministic / rules-based, not generative

Per the PRD (§5.1, §5.2) and `FEATURE_SPECIFICATIONS.md` (1.7, 2.1), these features carry real legal or decision-making consequence and must be reproducible: the same inputs must always produce the same output, and the output must be explainable step-by-step to a user or, if needed, a regulator or court. An LLM — even a well-grounded RAG one — cannot guarantee bit-for-bit reproducibility or a clean audit trail of "why this number," because generation is probabilistic and prompt/model-version drift changes outputs over time.

| Feature | FEATURE_SPECIFICATIONS.md ref | Why deterministic | How (mechanism) |
|---|---|---|---|
| Expansion Readiness Score | 1.7 | Composite 0–100 score with driver breakdown must be reproducible/auditable per the PRD — an activation metric depends on it, and organizations will make capital decisions partly on this number | A weighted scoring function: `score = f(complianceCompletionPct, marketClarityFlags, capitalReadinessAnswers)`, implemented as plain TypeScript/SQL, versioned (`scoringRulesVersion` stored alongside the result), unit-testable with fixed input→output cases |
| Entity Formation recommendation | 2.1 | Recommends WOS/JV/LLP/Branch/Liaison/Project Office — a decision with real legal consequence; must trace to the specific questionnaire answers that drove it | A rules/decision-tree engine keyed to the questionnaire (operating model, FDI-sensitivity, timeline) per `research/india-market-entry-regulatory-landscape.md` §2 — implemented as an explicit decision table or `if/switch` rules module, not a prompt, with each branch's rationale stored as static text tied to the branch, not generated per-call |
| Site Selection scoring | 4.3 | User-defined scoring weights over city/mall/CRE attributes must be transparent and reproducible when a user changes a weight and expects a predictable re-rank | Weighted-sum scoring over structured attributes (real-estate cost, distribution maturity, demographic fit, etc.), computed server-side, no model call |
| City Recommendations ranking (the scores themselves, not the narrative gloss) | 1.6 | Per-criterion score breakdown must be traceable to the user's chosen weights | Same weighted-sum mechanism as Site Selection — shared scoring utility in `lib/core` |

**Implementation shape:** a small internal "rules engine" module (`lib/core/scoring/`), not a generic rules-engine product/library dependency — at MVP scale (four scoring features, all additive/weighted-sum in nature) a bespoke, well-tested TypeScript module is simpler and more auditable than adopting an external business-rules engine. Each scoring function:
- takes typed, versioned inputs,
- returns the score **plus** a driver/rationale breakdown structure (not just the number),
- is pure (no side effects, no model calls) so it is trivially unit-testable and its output is provably reproducible given the same inputs and rules version,
- writes its `rulesVersion` alongside the result so historical scores remain explainable even after the rules are later tuned.

These outputs may still be *rendered* using the AI Output Standard's shape (`summary`, `confidence`, `sources[]`, `assumptions[]`, `generatedAt`) for UI consistency, but `modelVersion` in that case is the **rules version**, not an LLM model identifier, and `confidence` reflects data completeness (e.g., "low" if the capital-readiness questionnaire is incomplete), not model uncertainty. This distinction must be visible in the code (e.g., a `sourceType: 'rules-engine' | 'llm-rag'` field on the insight record) so nothing downstream conflates the two.

---

## 4. Category (d) — Requires external data/API dependency not yet available

These are flagged, per the project's research discipline, as **"Requires further validation / external data licensing"** rather than built against a fabricated or scraped data source at MVP. MVP ships a clearly labeled seed/mock version; the real integration is a documented future swap.

| Feature | Why it's blocked at MVP | What a real integration looks like |
|---|---|---|
| Real-time competitor pricing | No licensed live pricing feed exists yet; scraping retailer sites is legally and operationally fragile and out of scope for MVP | A licensed pricing-intelligence data provider (or a vetted, ToS-compliant scraping partner) feeding a `CompetitorPrice` table on a scheduled refresh; Pricing Intelligence (1.4) would retrieve from this table instead of the static seed corpus |
| Live BIS/QCO certification status lookup | No public real-time API for BIS certificate status is confirmed available/licensed | A direct integration with BIS's certificate database or a licensed compliance-data vendor (Phase 1 flagged ClearTax/Cygnet-style partners as the likely build-vs-license answer for adjacent GST content — the same partner-not-build principle applies here); until then, 2.4's "last verified" date is a manual-update field, not a live status |
| Live footfall data for malls | Phase 1 found even incumbent vendors' footfall figures are panel-based estimates, not census data — no authoritative live source exists to integrate against | If/when a panel-data vendor (mobile-location-analytics style) is licensed, Mall Intelligence (4.2) would ingest a periodic feed; footfall stays labeled "directional, not guaranteed" regardless |
| Real estate cost benchmarks (live) | No live CRE pricing feed; MVP uses curated/estimated benchmark ranges | A licensed CRE data provider or manually-refreshed benchmark table with visible "as of" dates |
| GST/e-invoicing live filing status | Phase 1 explicitly flagged this as "partner, not build" (ClearTax/Cygnet-style) | API integration with a licensed GST service provider (GSP), not a Yorkstn-built filing engine |

Each of these, if/when unblocked, plugs into the existing category (a) or (b) data layer as a new source with its own `lastVerified`/`retrievedDate` metadata — no architectural rework is needed, only a new ingestion job and corpus/table population.

---

## 5. Provider, interface, and confidence/citation mechanism

### 5.1 Provider choice and provider-agnostic interface

**Recommendation: target Anthropic Claude** (this is a Claude-Code-built project, and Claude's long-context + citation-friendly instruction-following suits the retrieval-grounded generation pattern in §1). However, the AI service is built **behind a provider-agnostic interface**, not a direct SDK call scattered through feature code:

```
lib/ai/
├── types.ts          AiOutputStandard type, AiGenerationRequest, AiGenerationResult
├── provider.ts        interface AiProvider { generate(req): Promise<AiGenerationResult> }
├── providers/
│   ├── mock.ts         deterministic seed/mock implementation — DEFAULT
│   └── claude.ts        real Anthropic Claude implementation — documented drop-in swap
├── retrieval.ts        RAG retrieval against pgvector corpus (§1)
└── index.ts             selects provider via AI_PROVIDER env var (default: 'mock')
```

**Explicit note for Phase 4 implementers: this environment has no real LLM API key configured.** The AI service layer must therefore default to the `mock` provider — a deterministic implementation that returns realistic, clearly-labeled seed content (drawing from the same curated corpus used for RAG, so mock output is not nonsense, just not model-generated) with `modelVersion: 'mock-v1'` and `confidence` derived from simple heuristics (e.g., data completeness of the retrieved context) rather than model self-assessment. Switching to a real Claude-backed implementation is a two-step, purely additive change once credentials exist: (1) set `AI_PROVIDER=claude` and `ANTHROPIC_API_KEY=...` in the environment, (2) no application code changes required because feature code only ever calls the `AiProvider` interface, never a provider SDK directly. This is flagged in `DEPLOYMENT_ARCHITECTURE.md`'s infrastructure checklist as a credential Yorkstn's team must provision before Category (a) features can produce real generative output in production.

### 5.2 Confidence scoring — concrete mechanism, not a vibe

`confidence` is not the model self-reporting a number (LLMs are poorly calibrated at this and it would violate "never a bare number presented as false precision" from the AI Output Standard). Instead, confidence is computed **outside** the model call from measurable retrieval/input signals:

- `high` — retrieval returned ≥N (e.g., 3) relevant chunks above a similarity threshold, all with a `lastVerified`/`retrievedDate` within a defined freshness window (e.g., 12 months), and all required user-profile inputs were present.
- `medium` — retrieval returned relevant chunks but some are stale, sparse, or partially off-topic (below-threshold similarity), or one non-critical input was missing.
- `low` — retrieval returned few/marginal chunks, or several inputs were missing/assumed.
- `insufficient-data` — retrieval returned nothing above threshold for the query, or a required input was missing entirely — in this case the feature should render the "insufficient data" state rather than let the model attempt an answer with no grounding at all.

This computation lives in `lib/ai/retrieval.ts` (or a `confidence.ts` alongside it) as a pure function over the retrieval result set and the input completeness — testable independent of any model call, and identical in both the `mock` and `claude` providers (confidence logic does not change when the provider swaps).

### 5.3 Citation extraction — concrete mechanism

To keep `sources[]` real rather than model-invented:
1. Each retrieved chunk passed into the prompt is given a stable reference tag (e.g., `[S1]`, `[S2]`) mapped server-side to its actual `{title, url, retrievedDate}` metadata.
2. The prompt instructs the model to inline-cite using only these tags when making a factual claim, and to state `assumptions[]` explicitly for anything not covered by a tagged chunk.
3. After generation, a post-processing step parses the output for `[S_]` tags, resolves each to its real metadata object, and populates `sources[]` **from the server-side mapping, not from anything the model wrote about the source** (the model never has to reproduce a URL or date itself, which removes the main fabrication vector — hallucinated citation details).
4. Any sentence-level claim without a resolvable tag either gets flagged into `assumptions[]` (if the pipeline has a claim-checking step) or, at minimum, the presence of untagged claims lowers `confidence` per §5.2. MVP can start with the simpler version (tag-then-map) and treat exhaustive per-claim verification as a post-MVP enhancement.

This same tag→metadata mapping mechanism is what the `mock` provider also implements (using the actual corpus chunks it "retrieved" for its deterministic seed answer), so citation behavior is validated end-to-end even with zero real LLM calls in this environment.

---

## 6. Summary classification table

| # | Feature | Category | Mechanism |
|---|---|---|---|
| 1.1 | Market Analysis | (a) RAG | Claude/mock + curated market corpus |
| 1.2 | Consumer Insights | (a) RAG | Claude/mock + demographic corpus |
| 1.3 | Competitor Intelligence | (a) narrative over (b) data | Curated directory (b) + narrative phrasing (a) |
| 1.4 | Pricing Intelligence | (a) RAG, cross-refs (b) | Claude/mock + comps corpus + Compliance duty data |
| 1.5 | Demand Forecasting | (a) RAG | Claude/mock + proxy-signal corpus, explicit methodology label |
| 1.6 | City Recommendations | (c) scores + (a) optional gloss | Weighted-sum scoring engine; optional narrative on top |
| 1.7 | Expansion Readiness Score | (c) Deterministic | Rules-based weighted scoring, versioned |
| 2.1 | Entity Formation recommendation | (c) Deterministic | Decision-tree rules engine |
| 2.2 | Import Compliance Checklist | (b) Curated DB | HSN-keyed rules table |
| 2.3 | GST Workflow | (b) Curated DB | Structured conditional rules |
| 2.4 | BIS Workflow | (b) Curated DB + (d) flagged | Static rules now; live status feed later |
| 2.5 | Trademark/IP Workflow | (b) Curated DB | Static stage reference data |
| 3.3 | AI Partner Recommendations | (c) matching + (a) rationale text | Deterministic match scoring; narrated rationale |
| 4.1/4.2 | City/Mall Intelligence | (b) Curated DB + (d) flagged (footfall) | Curated benchmark data; footfall externally unavailable |
| 4.3 | Site Selection scoring | (c) Deterministic | Weighted-sum scoring engine |
| — | Real-time competitor pricing | (d) Flagged | Requires licensed feed |
| — | Live BIS certification status | (d) Flagged | Requires licensed integration |
| — | Live footfall data | (d) Flagged | No authoritative source exists yet |
