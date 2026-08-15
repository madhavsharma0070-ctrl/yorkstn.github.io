# Yorkstn — Validation Plan

**Purpose:** Phase 1 and Phase 2 both surfaced findings and product decisions explicitly labeled as inference, hypothesis, or assumption rather than verified fact (per the project's "cite or label as assumption, never fabricate" discipline). This document is the plan for closing that gap with real evidence post-MVP — it is not itself validation, and nothing in it should be read as confirming any hypothesis it lists.

## 1. Core hypothesis validation (customer discovery)

The PRD's central bet — that no existing platform integrates market intelligence + India compliance + partner discovery, and that this integration is what a mid-size international brand actually needs — was derived from a landscape survey (Phase 1 research), **not from talking to a single target-ICP brand.** Before or alongside MVP build-out:

- **Target:** 10–15 structured discovery interviews across the 6 ICP categories (`PRD.md` §3), split between brands that have already attempted India entry (retrospective: what broke, what took longest, what they'd pay to avoid repeating) and brands actively considering it (prospective: what's blocking the decision today).
- **Key questions to test, not assume:** Is the "5+ vendors plus an advisory firm" pattern Phase 1 inferred from public competitor research actually what these brands experience? Would they trust an AI-generated demand forecast for a market with no sales history, or does the "cold start" problem need a fundamentally different trust-building UX (e.g., showing methodology more prominently than the number itself)? Is the SaaS + optional-managed-services model priced/structured the way real buyers expect, or does the Section 4 pricing tier structure need rework?
- **Explicit falsification targets:** if 10+ interviews show brands are *not* willing to act on an AI-generated city recommendation without a human advisor's sign-off, that materially changes Milestone 5/7's build priority (Retail Expansion Intelligence's roadmap/launch-planning value may need to lead ahead of AI Market Intelligence's generative outputs, inverting `MVP_ROADMAP.md`'s current sequencing rationale).

## 2. Instrumentation plan for PRD §8 success metrics

The PRD explicitly labels its success metrics as unmeasured hypotheses. Before they can be reported on, the product needs:
- **Activation:** event tracking on Readiness Score + City Recommendation completion within first session (timestamp delta from account creation).
- **Engagement:** weekly-active-organization tracking on `/dashboard` opens during a flagged "active expansion" period (defined as: has an in-progress `expansion_roadmap` with at least one non-`not_started` milestone).
- **Compliance value:** proportion of `compliance_workflow_items` reaching `status='completed'` inside the platform vs. abandoned mid-workflow (a proxy for "tracked to completion in-platform rather than reverting to spreadsheets/email," which Phase 1 research suggests is the current default behavior).
- **Partner value:** conversion rate from `partner_recommendations` shown → `introduction_requests` sent → `status='accepted'`.
- **Requires further validation:** what counts as a meaningful baseline/target for each of these — there is no comparable-product benchmark data available (Phase 1 found no competitor publishes funnel metrics for this specific integrated use case), so early targets should be treated as internal directional baselines, not externally benchmarked goals.

## 3. Design-partner pilot program (post-MVP)

- **Structure:** 3–5 design-partner brands, one or two per ICP category where feasible, using the live MVP (not a mockup) for a real (or real-intent) India entry evaluation, in exchange for reduced/waived subscription cost and direct product input.
- **What a pilot should specifically test that interviews cannot:** whether the Compliance OS's deterministic entity-formation recommendation and checklist survive contact with an actual filing process (does the generated checklist match what a real Indian company-secretary/CA says is needed); whether Partner Discovery's seeded/curated partner data (necessarily thin at MVP launch — see `MVP_ROADMAP.md`'s mock-data milestones) is dense enough in at least one category/city to produce a real introduction, or whether partner-side supply needs to be seeded manually before brand-side pilots can get real value.
- **Exit criteria for "pilot succeeded":** at least one design-partner brand reports the platform changed a real decision (e.g., which city to target, which entity structure to pursue) rather than merely being informative — this is the bar that would start to support (not prove) the PRD's core integration hypothesis.

## 4. Phase 1 research figures requiring primary-source re-verification before shipping as in-product content

Per `BLUEPRINT.md` §1 and the individual research reports' own methodology sections, **every** `.gov.in`-sourced fact in Phase 1 was obtained via search-indexed snippets and secondary-source cross-checking, not direct primary-source retrieval (WebFetch to government domains returned HTTP 403 throughout Phase 1). The following are the highest-stakes examples that must be directly re-verified against the live primary source **before** they are surfaced as authoritative content inside the Compliance OS (as opposed to being fine as illustrative examples in this research/planning documentation):

| Figure | Where it would surface in-product | Re-verify against |
|---|---|---|
| Multi-Brand Retail Trading FDI cap (51%) and $100M/50%-back-end-infrastructure conditions | Entity Formation workflow's FDI-route guidance | Live DPIIT Consolidated FDI Policy (`research` flagged 2026 status as ambiguous/uncertain) |
| GST 2.0 rate slabs (0/5/18/40%) | GST workflow, Pricing Intelligence's duty-adjusted price recommendation | Live GST Council rate notification / gst.gov.in |
| BIS FMCS Performance Bank Guarantee (~USD 10,000) | BIS workflow's certification-cost estimate | Live BIS FMCS fee schedule, bis.gov.in |
| DPIIT recognition turnover ceiling (₹200 crore, post-Feb-2026 notification) and Deep Tech category terms | Any in-product DPIIT-eligibility-adjacent content (currently none is planned as customer-facing in MVP, but flagged given `research/india-dpiit-startup-ecosystem.md`'s own eligibility-question list) | Live DPIIT Gazette notification |
| SIPP scheme lapse (31 March 2026, no confirmed renewal) | Trademark/IP workflow's fee-rebate expectation-setting, if surfaced | ipindia.gov.in |
| Four Labour Codes' state-level rule notification status | Hiring/payroll guidance, if added post-MVP (not in the 4 MVP modules currently) | EPFO/ESIC/state labour department portals |

**Process recommendation:** the Compliance OS's content pipeline (per `SYSTEM_ARCHITECTURE.md`/`AI_ARCHITECTURE.md`'s Category-(b) curated-lookup-table design) should treat this table as its first re-verification backlog, and the `content_last_verified_at`/`source_url` columns already built into `cities`, `malls`, and `compliance_workflow_items` (per `DATABASE_SCHEMA.md`) exist specifically so this re-verification work is trackable per-fact, not an undifferentiated "check everything someday" task.

## 5. What this validation plan deliberately does not cover

Per the PRD's non-goals and this project's "no fabrication" discipline, this plan does not project revenue, conversion rates, or market share for Yorkstn itself — doing so would repeat the exact fabrication risk Phase 1 was designed to avoid, just one level up (projecting Yorkstn's own numbers instead of a competitor's). Any such projection should be built later, from this validation plan's actual results, not assumed now.
