# Yorkstn — Feature Specifications

Detailed specification per feature, grouped by module. Each feature lists: description, inputs, outputs, data dependencies, and the AI-Output Standard where applicable. Cross-reference `USER_STORIES.md` for the story IDs each feature satisfies.

## AI Output Standard (applies to every AI-generated feature below)

Every AI-generated output in the platform must render as a structured object with:
- `summary` (the human-readable output)
- `confidence` (`high` / `medium` / `low` / `insufficient-data`) — never a bare number presented as false precision
- `sources[]` (citation objects: title, url, retrieved-date) where the output draws on external data
- `assumptions[]` (explicit list of what was assumed, not verified, when sources are thin)
- `generatedAt` (timestamp) and `modelVersion`

This directly operationalizes Phase 1's "cite or label as assumption, never fabricate" rule inside the product itself, and determines the `AiInsight` data model in `DATABASE_SCHEMA.md`.

---

## Module 1 — AI Market Intelligence

### 1.1 Market Analysis (US-10)
- **Input:** Organization's brand profile (category, sub-category, price tier, home country).
- **Output:** Narrative + structured market-size/trend summary for that category in India, following the AI Output Standard.
- **Data dependency:** Category-level market data corpus (MVP: curated from Phase 1-style secondary research + licensed data where available; see `AI_ARCHITECTURE.md` for the RAG design). **Requires further validation / external data licensing** — MVP ships with a clearly labeled seed dataset, not a live licensed feed.

### 1.2 Consumer Insights (US-11)
- **Input:** Brand profile + selected city/region.
- **Output:** Regional/demographic behavior summary relevant to category, per AI Output Standard.

### 1.3 Competitor Intelligence (US-12)
- **Input:** Brand category.
- **Output:** List of known competitors active in India in that category, with channel and price-point positioning where known; each entry cites its source or is flagged `insufficient-data`.
- **Data dependency:** Competitor directory (MVP: manually curated seed list per category, extensible via admin content tools — see `AI_ARCHITECTURE.md`).

### 1.4 Pricing Intelligence (US-13)
- **Input:** Brand's home-market price points (user-entered), category, target city tier.
- **Output:** Recommended India price-point range with a margin-sensitivity note (duty/GST/logistics-adjusted, referencing Compliance OS duty data where a product HSN code is on file).

### 1.5 Demand Forecasting — "cold start" (US-14)
- **Input:** Category, price tier, city shortlist.
- **Output:** A forecast range (not a point estimate) built from category/city/comparable-brand proxy signals rather than the organization's own sales history, explicitly labeled `methodology: proxy-based (no first-party sales history)` to avoid implying more certainty than the underlying data supports.

### 1.6 City Recommendations (US-15)
- **Input:** Brand profile + (optional) user-adjustable weighting across criteria (competitive density, real-estate cost, distribution maturity, demographic fit).
- **Output:** Ranked list of cities with a per-criterion score breakdown, each linking through to `Retail Expansion Intelligence → City Intelligence` for depth.

### 1.7 Expansion Readiness Score (US-16)
- **Input:** Aggregated status across Compliance OS (workflow completion %), Market Intelligence (has the org reviewed city/pricing/demand outputs), and a short capital/timeline self-assessment questionnaire.
- **Output:** Composite score (0–100) with a driver breakdown (e.g., "Compliance: 20/40, Market clarity: 30/30, Capital readiness: 10/30") — deterministic/rules-based scoring, **not** an LLM-generated number, since a composite readiness score must be reproducible and auditable (see `AI_ARCHITECTURE.md` for the explicit deterministic-vs-generative feature split).

---

## Module 2 — Compliance Operating System

### 2.1 Entity Formation Workflow (US-20)
- **Input:** Guided questionnaire (planned operating model: retail/wholesale/e-commerce/manufacturing; FDI-sensitivity; timeline).
- **Output:** Recommended entity type (WOS/JV/LLP/Branch/Liaison/Project Office) with rationale, plus an auto-generated task checklist (e.g., SPICe+ filing, FC-1 if applicable) with due-date scaffolding.
- **Deterministic, not generative:** entity recommendation follows a rules engine keyed to the questionnaire per `research/india-market-entry-regulatory-landscape.md` §2, not free-form LLM generation, since this is a decision with real legal consequence.

### 2.2 Import Compliance Checklist (US-21)
- **Input:** Product HSN code(s).
- **Output:** Applicable-steps checklist: IEC status, DGFT/CBIC clearance steps, BIS/QCO applicability flag (linking to 2.4), Legal Metrology labelling requirements.
- **Content source:** Rules table keyed by HSN code, versioned with a "last verified" date per rule per the IA's content-depth convention.

### 2.3 GST Workflow (US-22)
- **Input:** Organization's registered states (derived from warehouse/store footprint entered elsewhere in the platform, e.g., Partner Discovery-sourced warehousing or Expansion site-selection outputs).
- **Output:** Per-state GST registration status tracker; flags a new state requiring registration when a new "fixed establishment" is added anywhere in the platform.

### 2.4 BIS Workflow (US-23)
- **Input:** Product category/HSN code.
- **Output:** QCO/FMCS/CRS applicability status and certification tracking per product line, with AIR/PBG documentation checklist where FMCS applies.

### 2.5 Trademark/IP Workflow (US-24)
- **Input:** Brand name/mark, filing jurisdiction (India).
- **Output:** Status tracker across search → filing → examination → publication → opposition window → registration, with key-date reminders.

### 2.6 Document Management (US-25)
- **Input:** File uploads attached to any compliance workflow item.
- **Output:** Versioned document store, one document history per workflow item, with type tagging (certificate, filing, POA, correspondence).

### 2.7 Timeline Tracking (US-26, US-27)
- **Input:** Aggregated due dates from 2.1–2.5.
- **Output:** Single cross-workflow calendar/list view, sortable by due date/status/module, each item showing its "last verified" source date.

---

## Module 3 — Partner Discovery Platform

### 3.1 Partner Directory & Search (US-30)
- **Input:** Filters — category (9 defined categories per PRD §5.3), city, verification status, capacity/scale attributes (e.g., MOQ for manufacturers).
- **Output:** Filtered, sortable partner list.

### 3.2 Partner Profile (US-31)
- **Fields:** Business name, category, cities served, verification status (`unverified` / `pending` / `verified`), verification documents (internal-only visibility), references, capacity attributes, contact channel (routed through the platform, not exposing raw contact info pre-introduction — see Security Architecture).

### 3.3 AI Partner Recommendations (US-32)
- **Input:** Organization profile + active expansion plan (target cities, category).
- **Output:** Ranked partner matches per category with a rationale string, per the AI Output Standard (confidence + sources, where "sources" for a recommendation means the matching signals used, e.g., "city match: Mumbai; category match: kids apparel manufacturing; verification: verified").

### 3.4 Introduction Requests (US-33)
- **Input:** Brand-side user selects a partner and submits an introduction request with context.
- **Output:** Request record with status (`sent` / `partner-viewed` / `accepted` / `declined`), visible to both sides; triggers a notification.

### 3.5 Partner Self-Service Profile (US-34)
- **Input:** Partner-role user builds/edits their own profile and uploads verification documents.
- **Output:** Profile in `pending` status until reviewed.

### 3.6 Verification Review Queue (US-35)
- **Input:** Yorkstn Staff reviews pending profiles/documents.
- **Output:** Approve → `verified`; Reject → `unverified` with a reason, visible to the partner only (not to brands).

---

## Module 4 — Retail Expansion Intelligence

### 4.1 City Intelligence (US-40)
- **Fields:** Demographics summary, competitive density (from Module 1.3 data), real-estate cost benchmark range, distribution-channel maturity (GT/MT/quick-commerce presence per `research/india-market-entry-regulatory-landscape.md` §14).

### 4.2 Mall Intelligence (US-41)
- **Fields:** Tenant-mix summary, lease benchmark range (MG + revenue-share convention per §12), footfall-proxy indicator (labeled as directional, not a guaranteed metric — Phase 1 found even incumbent vendors' footfall figures are panel-based estimates, not census data).

### 4.3 Site Selection Workspace (US-42)
- **Input:** Candidate sites (manually added or sourced via Partner Discovery's CRE category), user-defined scoring weights.
- **Output:** Scored/ranked shortlist, exportable.

### 4.4 Expansion Roadmap (US-43)
- **Output:** Sequenced, dependency-aware plan template (Entity Formation → Compliance clearances → Partner selection → Site selection → Launch), auto-populated from status across modules, user-editable.

### 4.5 Financial Projections (US-44)
- **Input:** User-entered assumptions (rent, staffing, COGS, marketing spend) alongside platform-provided benchmark ranges (rent from 4.2, duty/GST from Compliance OS) as reference, not auto-filled fact.
- **Output:** A projection workspace (revenue/cost/margin over a user-defined horizon) explicitly labeled as a **modeling tool the user owns**, not a guaranteed forecast — consistent with the PRD's non-goal that Yorkstn does not present speculative financials as fact.

### 4.6 Launch Planning (US-45)
- **Output:** Task/timeline view for go-live execution, linkable to Expansion Roadmap milestones.

### 4.7 Expansion Dashboard (US-46)
- **Output:** Cross-module summary: Readiness Score, open Compliance tasks (top N by due date), Partner introduction status, Roadmap milestone progress. This is the default landing page after `/dashboard`.

---

## Managed Services (cross-cutting)

### M.1 Request Engagement (US-50)
- **Input:** Triggered from any Compliance OS workflow ("Get expert help with this") or standalone from `/managed-services`.
- **Output:** Engagement record (scope, linked workflow item, status) visible to the requesting organization and assigned Yorkstn Staff.

### M.2 Engagement Tracking (US-51)
- **Output:** Status list (`requested` / `scoping` / `in-progress` / `delivered`) with notes/deliverable links, visible inside the brand's own dashboard (not a separate off-platform channel).
