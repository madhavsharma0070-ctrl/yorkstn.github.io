# Yorkstn — Product Backlog

**Phase:** 2 (Product & Architecture Design)
**Depends on:** `USER_STORIES.md` (source of story IDs), `PRD.md` (business-model hypotheses in §4/§8/§9), `ACCEPTANCE_CRITERIA.md`, `MVP_ROADMAP.md` (build order — this document is priority, not sequence)

This backlog re-organizes every story in `USER_STORIES.md` by module with an explicit priority tier. **Priority tier is not the same as build order** — see `MVP_ROADMAP.md` for dependency-driven sequencing; this document answers "how important is this," `MVP_ROADMAP.md` answers "in what order do we build it."

## Priority tiers

- **P0 — MVP-blocking.** The four MVP modules (PRD §5) are not truthfully describable as "shipped" without this. Missing a P0 item means the module fails its own user stories' acceptance criteria.
- **P1 — important post-MVP-launch.** Materially improves the product for the ICP but the module is usable and honest without it at initial launch; expected in the first post-launch iteration cycle.
- **P2 — nice-to-have / future hypothesis.** Either a lower-value enhancement, or — for the business-model items explicitly called out in PRD §4/§9 — a **not-yet-validated hypothesis**, not a committed roadmap item. Building P2 business-model items before validating them would contradict the PRD's own "no fabrication / label as hypothesis" discipline.

## Definition of Done (applies to every backlog item, tier-scaled)

A single consistent DoD convention, scaled by tier so P0 rigor doesn't get diluted and P2 items aren't gold-plated before they're validated:

- **P0 Definition of Done:** implemented per its `ACCEPTANCE_CRITERIA.md` entry (or an equivalent Given/When/Then written before implementation if none exists yet) → RBAC-enforced at the API layer, not just hidden in the UI (per US-60/61's hard requirement) → unit-tested for any deterministic/scoring logic (per `AI_ARCHITECTURE.md` §3's reproducibility requirement) → documented (the route/data-model/API surface reflected in `INFORMATION_ARCHITECTURE.md`-consistent structure) → for any AI-generated output, conforms to the AI Output Standard (`summary`/`confidence`/`sources[]`/`assumptions[]`/`generatedAt`/`modelVersion`) → loading/empty/error states implemented per `UI_UX_WIREFRAMES.md`.
- **P1 Definition of Done:** same as P0, minus the requirement that it block an MVP launch decision — i.e., it must still be RBAC-correct and tested before shipping, it just isn't a gate on declaring MVP complete.
- **P2 Definition of Done:** before any building starts, the item must have a written validation basis (customer discovery evidence, usage data, or an explicit business decision to proceed) per `VALIDATION_PLAN.md` — a P2 item does not get a build DoD until it is promoted to P0/P1 by that evidence.

---

## Onboarding

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-01 | Create organization + brand profile in under 5 minutes | P0 | Nothing else in the product is reachable without this; first-run experience for Daniel's self-serve motion (`PERSONAS.md` #4) |
| US-02 | Invite Compliance Manager/Analyst with roles | P0 | Required for Priya's multi-seat org (`PERSONAS.md` #1); RBAC-enforced invite acceptance |
| US-03 | Guided first-session path (Readiness Score → City Recommendations → next steps) | P0 | Directly operationalizes the PRD §8 activation hypothesis — without this guided path, activation is left to chance |

## Module 1 — AI Market Intelligence

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-10 | Market analysis for brand's category | P0 | Core "should we enter India" surface (PRD §5.1); Category (a) RAG per `AI_ARCHITECTURE.md`, ships on `mock` provider |
| US-11 | Consumer insight summaries by region/city tier | P0 | Same module, same AI-layer dependency |
| US-12 | Competitor list with channel/price-point positioning | P0 | Category (a) narrative over Category (b) curated directory |
| US-13 | Recommended India price point vs. home-market pricing | P0 | Cross-references Compliance OS duty/HSN data (Module 2) |
| US-14 | Demand forecast without India sales history ("cold start") | P0 | The PRD's named differentiator (§2, §5.1) — this is not a generic nice-to-have forecast feature, it is the specific gap Yorkstn exists to close |
| US-15 | Ranked city shortlist matched to brand profile | P0 | Category (c) deterministic scoring + optional Category (a) gloss; feeds Expansion Readiness Score and City Intelligence |
| US-16 | Expansion Readiness Score (composite, driver breakdown) | P0 | Deterministic per `AI_ARCHITECTURE.md` §3; the PRD §8 activation metric is defined in terms of this exact feature |
| US-17 | Source/citation + generation-date display on every AI output | P0 | Not a separate feature so much as a cross-cutting requirement of every item above — cannot be deferred without violating the AI Output Standard on day one |
| — | User-adjustable weighting UI for City Recommendations criteria (beyond a fixed default weighting) | P1 | `FEATURE_SPECIFICATIONS.md` §1.6 lists this as "(optional) user-adjustable" — a sensible default weighting can ship first, adjustable weighting follows |
| — | Confidence-threshold tuning / admin visibility into retrieval quality signals | P1 | Operational tooling for Yorkstn Staff to monitor AI Output Standard confidence distribution, not a brand-facing feature |
| — | Real-time competitor pricing feed | P2 | Explicitly flagged Category (d) in `AI_ARCHITECTURE.md` §4 — "no licensed live pricing feed exists yet"; requires external data licensing decision before it is buildable at all |

## Module 2 — Compliance Operating System

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-20 | Entity type decision tool (WOS/JV/LLP/Branch/Liaison) | P0 | Deterministic rules engine, real legal consequence; `MVP_ROADMAP.md` Milestone 2 first vertical slice |
| US-21 | Import compliance checklist scoped to HSN code | P0 | Category (b) curated lookup |
| US-22 | GST registration tracking per state | P0 | Category (b); triggers on footprint growth from Expansion/Partner data |
| US-23 | BIS/QCO certification tracking per product line | P0 | Category (b) + Category (d)-flagged for live status (out of MVP scope, static/manual-update field is P0-sufficient) |
| US-24 | Trademark/IP filing status + key-date tracking | P0 | Category (b) static stage reference data |
| US-25 | Document upload/versioning per workflow item | P0 | Cross-cutting dependency for US-20–24; RBAC-enforced upload/delete is explicitly tested in `ACCEPTANCE_CRITERIA.md` |
| US-26 | Cross-workflow timeline (single sortable view) | P0 | Aggregates US-20–24; PRD §8's "compliance value" success metric depends on a case being tracked to completion inside this view |
| US-27 | "Last verified" date + source link on every rule/checklist item | P0 | Operationalizes PRD Risk #4 (all regulatory figures require primary-source re-verification) — this is a hard product requirement, not a display nicety, per `INFORMATION_ARCHITECTURE.md` §5 |
| US-28 | Yorkstn Staff assignment to specific orgs' compliance cases | P0 | Required for the Managed Services model itself to function (PRD §4) — without scoped assignment, the managed-services layer cannot operate inside the platform at all |
| — | Staleness-threshold configurability (e.g., org-level override of the default 180-day threshold) | P1 | A fixed platform-wide default threshold is P0-sufficient; per-org configurability is a refinement |
| — | Automated regulatory-change alerting (e.g., "GST rate for HSN X changed since your last review") | P1 | Valuable but requires a change-detection pipeline on top of the existing content model — not required for the base timeline/tracking value prop |
| — | Direct GST/e-invoicing live filing integration (ClearTax/Cygnet-style partner) | P2 | PRD Risk #1 explicitly frames this as "partner, not build," and as a future integration decision requiring vendor evaluation, not an MVP commitment |
| — | Live BIS/QCO certification status feed | P2 | Category (d)-flagged; no confirmed available/licensed API exists — future integration only |

## Module 3 — Partner Discovery Platform

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-30 | Search/filter partners by category, city, verification status | P0 | Core directory value prop; addresses the Phase 1-identified partner-discovery gap directly |
| US-31 | View verified partner profile (status, documents, references) | P0 | The verification differentiator vs. unverified directories (PRD §5.3) is the whole point of this module — cannot be deferred |
| US-32 | AI partner recommendations matched to org profile + plan | P0 | Deterministic matching + Category (a) narration; PRD §8's "partner value" success metric is defined in terms of this feature |
| US-33 | Introduction requests with status tracking | P0 | Closes the loop from recommendation/search to an actual logged action — required for the PRD §8 partner-value metric to be measurable at all |
| US-34 | Partner self-service profile + verification submission | P0 | Without partner-side profile creation, the directory has no supply side to search |
| US-35 | Yorkstn Staff verification review queue | P0 | The verification workflow (approve/reject) is what makes "verified" mean something — required alongside US-34, not optional |
| — | Partner-side analytics (views/introduction-request volume on their own profile) | P1 | Valuable partner-retention feature, not required for brand-side MVP value |
| — | Bulk/CSV partner profile import for Yorkstn Staff-curated seed expansion | P1 | Operational efficiency tool for internal content-ops, not a brand- or partner-facing feature |
| — | **Partner-verification fees** (charged to partners for verified status) | P2 — flagged hypothesis | Explicitly named in PRD §4 as "future (post-MVP, not committed) ... requiring validation" — must not be built as a monetization feature before `VALIDATION_PLAN.md`'s validation work establishes partner willingness-to-pay; building this prematurely risks damaging early partner-supply trust |
| — | **Transaction facilitation fees on partner introductions** | P2 — flagged hypothesis | Same PRD §4 flag; also directly adjacent to the PRD §6 non-goal that Yorkstn does not process payments between brands and partners in MVP — this is explicitly a future-phase hypothesis, not a roadmap commitment |
| — | Real business-verification data provider integration (D&B-style) | P2 | PRD Risk #2: "no in-house KYC/verification engine should be built before evaluating existing providers" — an internal Yorkstn Staff review queue is P0-sufficient for MVP; an external data-provider integration is a future enhancement contingent on vendor evaluation |

## Module 4 — Retail Expansion Intelligence

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-40 | City intelligence detail (demographics, density, RE cost, distribution maturity) | P0 | Deepens Module 1's City Recommendations; needed for a defensible board case per Priya's success criteria |
| US-41 | Mall intelligence (tenant mix, lease benchmarks, footfall proxies) | P0 | Required for Site Selection (US-42) to have real inputs; footfall explicitly labeled directional, not guaranteed |
| US-42 | Site-selection scoring workspace | P0 | Category (c) deterministic scoring; core "turn intelligence into a plan" value prop of this module (PRD §5.4) |
| US-43 | Expansion roadmap (sequenced, dependency-aware) | P0 | The structural spine tying all four modules together for Priya/Daniel's board-ready narrative |
| US-44 | Financial projections workspace (user assumptions + platform benchmarks) | P0 | Must ship with the user-vs-platform-data visual distinction as a hard requirement (PRD §6 non-goal on speculative financials-as-fact), not as a later refinement |
| US-45 | Launch planning task/timeline view | P0 | Closes the roadmap out to actual go-live execution; without it the Roadmap ends at "site selected" with no execution layer |
| US-46 | Expansion Dashboard (cross-module summary, default home) | P0 | PRD §8's engagement success metric ("opens the Expansion Dashboard at least weekly") is defined in terms of this exact screen |
| — | Exportable/shareable Expansion Roadmap and Site Selection outputs (PDF/deck export for board presentations) | P1 | High value for Priya's "board-ready case" goal (`PERSONAS.md` #1) but not required for the underlying workflow to function |
| — | Multi-scenario Financial Projections (compare City A vs. City B side-by-side) | P1 | Natural enhancement once the single-scenario workspace (US-44) is proven |
| — | Live CRE/real-estate pricing feed integration | P2 | Category (d)-flagged; curated/estimated benchmark ranges with "as of" dates are P0-sufficient for MVP |
| — | Live footfall panel-data integration | P2 | Category (d)-flagged; Phase 1 found even incumbent vendors' footfall figures are estimates, not census data — no authoritative source exists to integrate against yet |

## Managed Services (cross-cutting)

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-50 | Request managed-services engagement from Compliance workflow or standalone | P0 | Operationalizes the PRD §4 secondary-revenue business model; without this the "optional upsell" has no product surface |
| US-51 | Yorkstn Staff update engagement status, visible in brand's own dashboard | P0 | PRD §4 explicitly requires this be inside the platform, "not a requirement to use the software" but also not a side-channel when used |
| — | Managed-services engagement templates by type (entity formation, complex filing, expansion advisory, partner-onboarding diligence — pre-scoped packages) | P1 | Improves the request experience once basic request/track (US-50/51) is proven; not required for the core loop |
| — | **Data/insights products** (e.g., syndicated India-market reports sold standalone) | P2 — flagged hypothesis | Explicitly named in PRD §4 as a "future (post-MVP, not committed)" revenue hypothesis requiring validation — no product surface should be built for this without `VALIDATION_PLAN.md` evidence of demand |

## Platform / Cross-cutting

| ID | Story | Tier | Notes |
|---|---|---|---|
| US-60 | Member role/permission management | P0 | Required from day one — Milestone 1 in `MVP_ROADMAP.md`; every other module's RBAC checks depend on a working role model |
| US-61 | Audit log of Compliance/Partner/Document changes | P0 | Explicitly required by Acceptance Criteria for accountability, especially for managed-services actions taken on an org's behalf by Yorkstn Staff |
| US-62 | Billing/subscription tier management | P0 (stubbed-acceptable) | A manual/admin-assigned tier is P0-sufficient for MVP per `MVP_ROADMAP.md`'s dependency map — a real payment processor integration is not required to declare MVP complete, since PRD §6 rules out marketplace payments in MVP entirely and subscription billing is a separate, lower-stakes payment surface that can launch with manual invoicing if needed |
| — | Self-service tier upgrade/downgrade with real payment processor (Razorpay/Stripe-class) | P1 | Needed for a scalable go-to-market motion, but manual/sales-assisted billing is an acceptable MVP-launch substitute |
| — | Global search across cities, malls, partners, compliance items (per `INFORMATION_ARCHITECTURE.md` §4) | P1 | Valuable navigation aid once module content volume justifies it; each module's own search/filter (already P0 within Partner Discovery, for example) covers the near-term need |
| — | In-app notification preferences (granular opt-in/out per notification type) | P1 | A single default notification set is P0-sufficient; per-type preferences are a refinement |

---

## Summary: P2 business-model hypotheses requiring validation before roadmap commitment

Per PRD §4 and §9, the following are explicitly **not** committed roadmap items, regardless of how the rest of this backlog is prioritized. They must not be scheduled into any `MVP_ROADMAP.md` milestone, and must not be built even as an "experiment" without a corresponding entry in `VALIDATION_PLAN.md` showing a validation basis:

1. **Partner-verification fees** (charged to partners, not brands).
2. **Data/insights products** (standalone data/report sales).
3. **Transaction facilitation fees** on partner introductions.

All three are carried in this backlog as P2 exactly so they are not forgotten, and exactly so they are never accidentally promoted to P0/P1 without the explicit evidence-gathering step `VALIDATION_PLAN.md` describes.
