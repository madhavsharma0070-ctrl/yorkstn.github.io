# Yorkstn — MVP Build Roadmap

**Phase:** 2 (Product & Architecture Design) — planning input for Phase 4 (autonomous implementation)
**Depends on:** `PRD.md`, `INFORMATION_ARCHITECTURE.md`, `FEATURE_SPECIFICATIONS.md`, `USER_STORIES.md`, `AI_ARCHITECTURE.md`
**Companion doc:** `MILESTONES.md` (exit criteria / Definition of Done per milestone below — this document explains *why* the order is chosen; `MILESTONES.md` is the checkable source of truth for *whether a milestone is done*)

## 0. Sequencing method

This roadmap uses **relative milestones (Milestone 1, 2, 3, …), not calendar time** — there is no real team velocity data to estimate from in this autonomous-build context, and assigning weeks would fabricate a precision that doesn't exist. Each milestone is sequenced strictly by **dependency**, not by module-number order in the PRD. The guiding principles, in priority order:

1. **Nothing ships before the platform foundation** — auth, organization/multi-tenancy, and RBAC enforcement must exist before any module screen is meaningful, since every module's data is organization-scoped and role-gated (per `INFORMATION_ARCHITECTURE.md` §3).
2. **Ship deterministic, low-AI-risk value first.** Per `AI_ARCHITECTURE.md`'s category classification, the Entity Formation workflow (Category c, deterministic rules engine) carries real legal consequence but zero generative-AI risk — it is buildable, testable, and demoable without any mock-AI-service layer at all. This makes it the highest-value/lowest-risk first vertical slice through the product, ahead of anything that depends on the AI service layer.
3. **Build the AI service layer once, generically, before any Category (a) feature needs it.** Market Analysis, Consumer Insights, Pricing Intelligence, Demand Forecasting, and the Partner Recommendation rationale text all depend on the same `lib/ai/` provider interface + `pgvector` RAG retrieval + confidence/citation mechanism (`AI_ARCHITECTURE.md` §5). Building this once as shared infrastructure — defaulting to the `mock` provider, since no real LLM credential exists in this environment — avoids five duplicated, drifting implementations.
4. **Partner Discovery needs seed data before it needs AI.** The directory, search/filter, and profile/verification workflow (Category b/structured data + plain CRUD) can and should ship before the AI Partner Recommendations feature, which is just a thin deterministic-matching + narration layer on top of a populated directory (per `AI_ARCHITECTURE.md` §6, row "3.3").
5. **Retail Expansion Intelligence's aggregating views ship last, deliberately.** City/Mall Intelligence detail views need Market Intelligence's city data; Site Selection needs Partner Discovery's CRE category; the Expansion Roadmap and Expansion Dashboard are explicitly cross-module summaries (`FEATURE_SPECIFICATIONS.md` §4.7 — "the default landing page," but structurally the *last* thing that can be fully populated, since it has nothing meaningful to summarize until the other three modules have data). Financial Projections likewise depends on Compliance OS duty/GST data and Mall Intelligence rent benchmarks as its reference inputs.
6. **Mock/seed data unblocks almost everything; real external credentials block only a clearly enumerated subset.** Every milestone below is explicitly marked with what it can ship on (mock/seed) vs. what it is blocked on (real service/credential), so Phase 4 never silently ships a feature that quietly depends on an unprovisioned secret.

## 1. Mock-data vs. real-credential dependency map

Per `AI_ARCHITECTURE.md` §4–5 and the (parallel-workstream, not-yet-existing-at-time-of-writing) `DEPLOYMENT_ARCHITECTURE.md`, the following is a reasonable assumption about what needs real infrastructure vs. what can run entirely on mock/seed data through MVP completion. If `DEPLOYMENT_ARCHITECTURE.md` lands with different conclusions, its infra checklist wins — this table should be reconciled against it, not the other way around.

| Capability | Can ship on mock/seed only? | Real dependency if/when unblocked |
|---|---|---|
| Auth (email/password or magic link) | Partial — a mock/dev auth provider can unblock all other milestones; a real transactional-email provider is needed for real invite/magic-link delivery | Email-sending service (e.g., Postmark/SES-class provider) |
| Organization/RBAC/multi-tenancy | Yes, fully — no external dependency at all | — |
| Entity Formation, Import, GST, BIS, Trademark/IP rules content | Yes — ships as a versioned, admin-curated seed table with `lastVerified`/`sourceCitation` per row (per `AI_ARCHITECTURE.md` §2) | A licensed GST/e-invoicing partner (ClearTax/Cygnet-style, per PRD Risk #1) only if/when live filing status becomes in-scope — **out of scope for MVP itself** |
| Document upload/versioning | Yes for local/dev; production needs object storage | Object storage bucket + credentials (e.g., S3-compatible) — a real infra dependency, but a generic/commodity one, not India-specific |
| Market Analysis, Consumer Insights, Pricing Intelligence, Demand Forecasting (Category a) | Yes — MVP defaults to the `mock` AI provider per `AI_ARCHITECTURE.md` §5.1, returning deterministic, clearly-labeled seed content drawn from the same curated corpus | Real Anthropic Claude API key (`AI_PROVIDER=claude`, `ANTHROPIC_API_KEY`) — purely additive swap, zero application-code changes required |
| Competitor Intelligence directory | Yes — admin-curated seed list | Real-time competitor pricing feed is explicitly Category (d)/flagged, not MVP scope |
| City/Mall Intelligence benchmark data | Yes — curated benchmark ranges with "as of" dates | Licensed CRE/footfall panel-data vendor — Category (d), explicitly flagged as unavailable/not MVP scope |
| Partner Directory + Verification workflow | Yes, fully — seed partner records + an internal verification queue are pure CRUD/workflow, no external dependency | None required for MVP; a real business-verification data provider (D&B-style, per PRD Risk #2) is a future enhancement, not a blocker |
| AI Partner Recommendations | Yes — deterministic matching (Category c) + `mock`-provider narration | Same Claude credential swap as above, once available |
| Notifications (in-app) | Yes, fully | Push/email notification delivery needs the same email-provider dependency as auth invites |
| Managed Services request/tracking | Yes, fully — pure workflow/status CRUD | None |
| Payments/billing (subscription tier) | Yes for a stubbed/manual tier assignment | Real payment processor (e.g., Razorpay per PRD Risk #2, or a Stripe-class global processor for USD-billed international brands) — **explicitly deferred**: PRD non-goals rule out marketplace/escrow payments in MVP, and subscription billing itself is not a hard MVP-blocking milestone below (see Milestone 6) |

**Working assumption pending `DEPLOYMENT_ARCHITECTURE.md`:** every milestone through Milestone 5 (inclusive) is achievable entirely on mock/seed data and a stubbed/dev auth+email setup, with zero real external credentials required to demo the full MVP scope end-to-end. Real credentials (transactional email, object storage, and — only if a design partner requires live generative output rather than labeled mock output — an Anthropic API key) are production-launch concerns, not build-order blockers.

---

## Milestone 1 — Platform Foundation

**Build:** Auth (signup/login/invite), Organization model + creation, multi-tenant data isolation, RBAC role model and enforcement at the API layer (per the role matrix in `INFORMATION_ARCHITECTURE.md` §3), seed-data loader, empty-state Expansion Dashboard shell, the persistent app shell (sidebar/top bar/org switcher per `UI_UX_WIREFRAMES.md` §0), and the Onboarding wizard (US-01, US-02, US-03).

**Why first:** every other module's screens, data, and RBAC checks assume an authenticated user inside a specific Organization with a specific role. Building any module before this exists means building on a foundation that will be retrofitted, not extended.

**Mock/seed status:** fully buildable on mock/seed data; auth can run against a dev/mock provider, invite emails can be logged/queued rather than actually delivered until a real email provider is provisioned.

**Depends on:** nothing upstream (first milestone).
**Blocks:** all subsequent milestones.

---

## Milestone 2 — Compliance Operating System: Entity Formation (first vertical slice)

**Build:** the Entity Formation questionnaire + deterministic recommendation engine (US-20), its task checklist, Document Management (US-25) generalized enough to attach to any workflow item, and the RBAC-enforced upload/delete rules (per Acceptance Criteria US-25).

**Why here, ahead of AI Market Intelligence:** per `AI_ARCHITECTURE.md` §3, Entity Formation is Category (c) — a pure deterministic rules engine, zero LLM/RAG dependency, and the PRD explicitly flags it as carrying real legal consequence, making correctness and auditability (not generative flexibility) the design constraint. It is the single highest product-value, lowest-engineering-risk full vertical slice available (questionnaire → decision → checklist → document upload → RBAC), and proves out the Document Management subsystem that every other Compliance workflow (Import, GST, BIS, Trademark/IP) will reuse in Milestone 3.

**Mock/seed status:** fully buildable on a seed rules table (decision-tree branches keyed to questionnaire answers, per `research/india-market-entry-regulatory-landscape.md` §2) — no external credential needed. Per `VALIDATION_PLAN.md`, the underlying regulatory content itself needs primary-source re-verification before being trusted as authoritative, but that is a content-accuracy workstream, not a build blocker for the workflow engine.

**Depends on:** Milestone 1 (auth/org/RBAC).
**Blocks:** Milestone 3 (reuses Document Management + the cross-workflow timeline pattern established here).

---

## Milestone 3 — Compliance Operating System: remaining workflows + cross-workflow timeline

**Build:** Import Compliance Checklist (US-21), GST Workflow (US-22), BIS Workflow (US-23), Trademark/IP Workflow (US-24), and the cross-workflow Timeline Tracking view (US-26, US-27) that aggregates all five Compliance workflows including Entity Formation.

**Why here:** these are all Category (b) — curated/structured lookup tables, no generative AI dependency, and they share the exact Document Management + task/due-date/RBAC pattern proven out in Milestone 2. Building the cross-workflow Timeline last within this milestone (not first) is deliberate — it has nothing to aggregate until the individual workflows exist.

**Mock/seed status:** fully buildable on seed rules tables (HSN-keyed checklist rules, GST state-registration conditional logic, BIS/QCO applicability table, trademark stage reference data) — no external credential needed.

**Depends on:** Milestone 2 (Document Management, workflow/task UI patterns).
**Blocks:** Milestone 6's Expansion Roadmap and Financial Projections (which read Compliance completion status and duty/GST reference data) and Milestone 5's Import/GST cross-reference for Pricing Intelligence.

---

## Milestone 4 — AI Service Layer (shared infrastructure, no user-facing feature yet)

**Build:** the provider-agnostic `lib/ai/` interface, the `mock` provider (default, per `AI_ARCHITECTURE.md` §5.1), the `pgvector`-backed RAG retrieval pipeline, the confidence-scoring mechanism (§5.2), and the citation-extraction/tag-mapping mechanism (§5.3) — plus ingestion of the seed corpus (Phase 1 `research/*.md` + any newly curated category/city content) into the retrieval index.

**Why here, as its own milestone rather than folded into Milestone 5:** five separate AI Market Intelligence features (Market Analysis, Consumer Insights, Competitor Intelligence narrative, Pricing Intelligence, Demand Forecasting) plus the Partner Recommendation rationale text all consume this same infrastructure. Building it once, generically, and unit-testing the confidence/citation mechanisms in isolation from any specific feature's UI, avoids five drifting, partially-duplicated implementations and matches `AI_ARCHITECTURE.md`'s explicit design intent. This milestone produces no new user-visible screen by itself — it is infrastructure that Milestone 5 and part of Milestone 7 consume.

**Mock/seed status:** fully buildable and testable with **zero real LLM credential** — this environment has no Anthropic API key configured, so the `mock` provider is not a placeholder to be embarrassed about, it is the correct MVP default per `AI_ARCHITECTURE.md` §5.1. A real Claude-backed provider is a documented, purely-additive two-step swap (`AI_PROVIDER=claude` + `ANTHROPIC_API_KEY`) whenever a real credential is provisioned — no milestone below should be blocked waiting for it.

**Depends on:** Milestone 1 (needs an Organization/BrandProfile schema to key retrieval queries against); benefits from, but does not strictly require, Milestone 2–3's Compliance data existing (Pricing Intelligence's cross-module duty/HSN read is the one feature-level dependency, deferred to Milestone 5).
**Blocks:** Milestone 5 (all Category (a) features) and the AI Partner Recommendations feature in Milestone 6.

---

## Milestone 5 — AI Market Intelligence module

**Build:** Market Analysis (US-10), Consumer Insights (US-11), Competitor Intelligence (US-12), Pricing Intelligence (US-13, cross-references Milestone 3's Compliance duty/HSN data), Demand Forecasting (US-14), City Recommendations (US-15, Category c weighted-sum scoring + optional Category a narrative gloss), Expansion Readiness Score (US-16, Category c — deterministic, reads Compliance completion % from Milestone 2–3), and the AI Output Standard citation display convention (US-17) applied consistently across all of the above.

**Why here:** this module is the primary "should we enter India" decision surface (PRD §5.1) and the PRD's activation success metric hypothesis (Readiness Score + City Recommendation in first session) depends on it — but every Category (a) feature in it needs Milestone 4's AI service layer, and the Readiness Score needs Milestone 2–3's Compliance completion data to compute a real driver breakdown rather than a stubbed zero.

**Mock/seed status:** fully buildable on the `mock` AI provider + curated seed corpus (category market data, competitor directory, demographic corpus) — no real external credential required for a fully functional, honestly-labeled MVP demo.

**Depends on:** Milestone 4 (AI service layer), Milestone 2–3 (Readiness Score's Compliance-completion input, Pricing Intelligence's duty/HSN cross-reference).
**Blocks:** Milestone 7's City Intelligence detail (reuses city data), Milestone 6's Expansion Roadmap/Dashboard (reads Readiness Score + City Recommendations).

---

## Milestone 6 — Partner Discovery Platform

**Build:** Partner Directory & Search (US-30), Partner Profile (US-31), Partner Self-Service Profile (US-34) and its separate `/partner-portal` shell, Verification Review Queue (US-35), Introduction Requests (US-33), and — last within this milestone, since it needs a populated directory to match against — AI Partner Recommendations (US-32).

**Why here, not earlier:** the directory and verification workflow are pure structured-data/CRUD (no dependency on Milestones 2–5 at all), so this module *could* technically be built in parallel with Milestones 2–5 if Phase 4 has capacity to parallelize; it is sequenced sixth here primarily because AI Partner Recommendations (the module's highest-value feature per Persona Meera's success criteria in `PERSONAS.md`) needs both a populated seed partner directory *and* Milestone 4's `mock` AI provider for its rationale-narration step, and needs Milestone 5's expansion-plan/target-city data to have something to match against.

**Mock/seed status:** fully buildable on a seed partner directory (a curated set of representative manufacturer/distributor/CRE/logistics/etc. profiles across the 9 PRD-defined categories) with a mock/internal verification queue — no external business-verification data provider is required for MVP (per PRD Risk #2, a real D&B-style provider is an explicit future enhancement, not an MVP blocker).

**Depends on:** Milestone 1 (RBAC — Partner is a distinct, lightweight role per `PERSONAS.md` #6); Milestone 4 (AI service layer) and Milestone 5 (expansion-plan data) specifically for the AI Partner Recommendations sub-feature only — the directory/search/verification pieces can build against Milestone 1 alone.
**Blocks:** Milestone 7's Site Selection (reads the CRE partner category) and Expansion Dashboard (reads partner introduction-request status).

---

## Milestone 7 — Retail Expansion Intelligence (aggregating module, deliberately last)

**Build:** City Intelligence detail (US-40, deepens Milestone 5's City Recommendations), Mall Intelligence (US-41), Site Selection Workspace (US-42, reads Milestone 6's CRE partner category), Expansion Roadmap (US-43, sequences Entity Formation → Compliance → Partners → Sites → Launch, reading status from Milestones 2, 3, 6), Financial Projections (US-44, reads Compliance duty/GST reference data from Milestone 3 and Mall Intelligence rent benchmarks from this same milestone), Launch Planning (US-45), and finally the Expansion Dashboard (US-46) — the cross-module "home" screen that summarizes Readiness Score (Milestone 5), open Compliance tasks (Milestones 2–3), Partner introduction status (Milestone 6), and Roadmap milestone progress (this milestone).

**Why last, deliberately, despite being the PRD's "primary home screen":** every screen in this module is explicitly a synthesis or aggregation of the other three modules' data (per `FEATURE_SPECIFICATIONS.md` §4's input columns — City Intelligence reads Module 1.3 competitor data, Site Selection reads Partner Discovery's CRE category, Financial Projections reads Compliance duty data and its own Mall Intelligence benchmarks, the Dashboard reads all three prior modules). Building it first would mean building against stub data for everything it displays; building it last means every card on launch day reflects real, already-built module data — the Dashboard's empty/loading/error states (per `UI_UX_WIREFRAMES.md` §2) are still explicitly designed for the case where an organization is new and has no upstream data yet, so an organization onboarding *during* this milestone's rollout still gets a coherent, honest experience.

**Mock/seed status:** fully buildable on mock/seed data throughout — City/Mall Intelligence benchmark ranges are curated (Category d/flagged only for *live* footfall/CRE feeds, which are explicitly out of MVP scope), and Site Selection/Roadmap/Financial Projections scoring is Category (c) deterministic, requiring no external credential.

**Depends on:** Milestones 2, 3, 5, 6 (reads data from all of them).
**Blocks:** nothing — this is the final MVP milestone.

---

## Milestone 8 — Managed Services + cross-cutting hardening (parallel-track, not a hard sequential dependency)

**Build:** Request Engagement (US-50) and Engagement Tracking (US-51), plus platform-wide cross-cutting items that should be continuously hardened rather than bolted on at the very end: audit log (US-61) tied to every Compliance/Partner/Document mutation from Milestones 2, 3, 6; member/role management (US-60, extending Milestone 1's RBAC); billing/subscription tier management (US-62, can ship as a manual/stubbed tier assignment for MVP per the dependency map in §1 — no real payment processor is a hard MVP blocker).

**Why treated as a parallel track rather than a strict eighth sequential step:** Managed Services' "Get expert help with this" entry point is contextual and threaded through Compliance workflows starting in Milestone 2 (per `FEATURE_SPECIFICATIONS.md` M.1 — "triggered from any Compliance OS workflow"), so its UI affordance should be stubbed in as early as Milestone 2 even though the full Engagement-tracking backend and the Yorkstn Staff-side `/admin` fulfillment view are reasonable to complete in this later milestone. Audit logging likewise should be instrumented incrementally as each mutating endpoint is built (Milestones 2–7), not retrofitted in one pass at the end — this milestone is where it is verified complete and comprehensive, not where it is invented from scratch.

**Mock/seed status:** fully buildable on mock/seed data — Managed Services is pure workflow/status CRUD with Yorkstn Staff acting as the internal fulfillment role (per `PERSONAS.md` #5); no external dependency.

**Depends on:** threads through Milestones 1–7 incrementally; treat as "complete and verified" only after Milestone 7 ships, since it needs every mutating surface in the product to exist before the audit log and RBAC matrix can be exhaustively checked.
**Blocks:** nothing structurally, but MVP launch readiness should not be declared until this milestone's audit-log and RBAC-enforcement items are verified complete, since `PRD.md` Risk items and the Acceptance Criteria's US-60/61 treat 403-at-the-API-layer as a hard requirement, not a nice-to-have.

---

## Summary sequencing table

| Milestone | Module(s) | AI dependency | External credential needed for MVP? |
|---|---|---|---|
| 1 | Platform Foundation (auth, org, RBAC, shell, onboarding) | None | No (dev auth/email stub sufficient) |
| 2 | Compliance — Entity Formation (first vertical slice) | None (Category c) | No |
| 3 | Compliance — Import/GST/BIS/Trademark + cross-workflow timeline | None (Category b) | No |
| 4 | AI Service Layer (shared infra) | Provider-agnostic, `mock` default | No |
| 5 | AI Market Intelligence | Category (a) via Milestone 4 + Category (c) scoring | No — `mock` provider is the MVP default |
| 6 | Partner Discovery | Category (c) matching + Category (a) narration via Milestone 4 | No |
| 7 | Retail Expansion Intelligence (aggregating module) | Category (c) scoring only | No |
| 8 | Managed Services + cross-cutting hardening | None | No (payment processor deferred beyond MVP) |

No milestone in this roadmap requires a real external credential to reach a fully functional, honestly-labeled MVP demo. Real credentials (transactional email delivery, object storage, a real Anthropic API key, and eventually a payment processor) are production-launch and go-to-market concerns layered on top of a build order that does not wait on any of them.
