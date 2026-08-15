# Yorkstn — Product Requirements Document (PRD)

**Phase:** 2 (Product & Architecture Design)
**Status:** Approved working baseline per user direction, 2026-07-23
**Depends on:** `/research/*.md` (Phase 1), `BLUEPRINT.md`

This PRD is the canonical product-truth document for Yorkstn's MVP. Every other Phase 2/3/4 document (data model, API, UI, engineering specs, code) must stay consistent with what is defined here. Where this document conflicts with anything else in the repo, this document wins unless a `DECISIONS.md` entry explicitly supersedes it.

---

## 1. Product Vision

> Yorkstn is a technology-first **Market Entry Operating System** that enables international consumer brands to launch, operate, and scale in India.

Yorkstn is a SaaS platform, not a trading company, distributor, buying house, brokerage, or traditional consultancy (per the founding mandate). The software platform is the primary product; managed services are an optional, paid layer for workflows that Phase 1 research indicated are not yet safely fully self-service in India today — legal/compliance execution, entity formation, strategic expansion decisions, and partner onboarding diligence.

## 2. Problem Statement

Phase 1 research (see `research/global-retail-market-entry-platforms.md` §"Cross-Cutting Gaps", `research/global-enterprise-compliance-ai-platforms.md` §11 and §"Cross-cutting gaps") established, as inference to be validated with real customers:

- No existing platform integrates market intelligence, India-specific compliance workflow, and retail/distributor partner discovery into one product. Brands currently stitch together 5+ point-solution vendors plus a traditional advisory firm.
- Demand-forecasting and site-selection incumbents assume an existing operating history; a brand with zero prior India sales has no tool built for its "cold start" problem.
- The India market-entry advisory segment (MERC, IME, Dezan Shira, Technopak, McKinsey/BCG/Bain India practices) is services-only, project-priced, and typically out of reach for mid-size international brands — leaving a gap between "free government trade-promotion agencies" and "premium MBB-style consulting."
- India's regulatory environment (GST 2.0, four new Labour Codes, 2026 CBIC circulars, retail FDI bifurcation, no dedicated franchise law) is fragmented and actively changing, making manual tracking costly and error-prone.

## 3. Target ICP (MVP)

Mid-size international consumer brands, specifically:

- International fashion brands
- Lifestyle brands
- Kids brands
- Beauty & personal care brands
- Home & living brands
- Specialty consumer brands

**Explicitly out of MVP scope:** large multinational conglomerates already served by MBB-style advisory (not excluded as future customers, but not the design target for MVP UX/pricing), and non-consumer sectors (industrial, B2B manufacturing components, financial services, healthcare/pharma — each has materially different compliance regimes not covered by Phase 1 research).

## 4. Business Model

- **Primary revenue:** SaaS subscription (tiered by organization size / module access — see `docs/phase2/PRODUCT_BACKLOG.md` and pricing notes in Section 9).
- **Secondary revenue:** Fee-based managed services for: entity formation execution, complex legal/compliance filings, strategic expansion advisory, and partner-onboarding diligence — positioned as an *optional upsell*, not a requirement to use the software.
- **Future (post-MVP, not committed):** partner-verification fees (charged to partners, not brands), data/insights products, transaction facilitation fees on partner introductions. Flagged in `docs/phase2/PRODUCT_BACKLOG.md` as post-MVP hypotheses requiring validation, per Phase 1's "no fabrication" discipline — no revenue projections are asserted here without labeling them as assumptions.

## 5. MVP Scope — Four Modules

### 5.1 AI Market Intelligence
Helps a brand answer "should we enter India, and where/how?" before committing capital.
- Market analysis (category-level India market sizing and trend synthesis, sourced/citation-aware)
- Consumer insights (regional/demographic behavior relevant to the brand's category)
- Competitor intelligence (who else in-category is active in India, at what price point/channel)
- Pricing intelligence (India price-point recommendation vs. brand's home-market pricing)
- Demand forecasting (addresses the Phase 1-identified "cold start" gap — forecasting for a brand with no India sales history, using category/city/comparable-brand proxies, not the brand's own historical data)
- City recommendations (ranked shortlist of Indian cities matched to brand category/price point/target consumer)
- Expansion readiness score (a composite score summarizing the brand's documented readiness across compliance, capital, and category fit)

### 5.2 Compliance Operating System
Helps a brand execute (not just understand) the regulatory steps to operate legally in India.
- Entity formation workflow (WOS/JV/LLP/Branch/Liaison decision + step tracking, per `research/india-market-entry-regulatory-landscape.md` §2)
- Import compliance checklist (IEC, DGFT/CBIC steps, HSN-linked duty/BIS applicability, per §3, §5)
- GST workflow (registration tracking per state as footprint grows, per §4)
- BIS workflow (QCO/FMCS/CRS applicability and certification tracking, per §5)
- Trademark/IP workflow (India trademark filing/opposition timeline tracking, per §7)
- Document management (versioned storage for filings, certificates, POAs)
- Timeline tracking (cross-workflow milestone/deadline view)

### 5.3 Partner Discovery Platform
Addresses the Phase 1-identified gap in distributor/partner discovery for foreign entrants.
- Manufacturers (contract manufacturing discovery, per §11)
- Franchise partners
- Retail partners / distributors (GT/MT distribution chain participants, per §14)
- Mall operators
- Commercial real estate (lease/CAM-aware CRE contacts, per §12)
- Logistics providers
- Warehousing (incl. bonded warehouse operators, per §9)
- Marketing agencies (localization-aware, per §15)
- Legal partners
- Verified vendor profiles (a verification workflow — status, documents, references — is core to differentiating from unverified directories like the B2B marketplaces Phase 1 found)
- AI partner recommendations (matches organization profile + expansion plan to partner profiles)

### 5.4 Retail Expansion Intelligence
Turns market intelligence into an operating plan.
- City intelligence (deep-dive per city: demographics, competitive density, real-estate cost, distribution maturity)
- Mall intelligence (mall-level data: footfall proxies, tenant mix, lease benchmarks)
- Site selection (shortlist/scoring workflow combining city + mall + CRE data)
- Expansion roadmap (sequenced plan: entity → compliance → partners → sites → launch)
- Financial projections (revenue/cost model scaffolding per city/channel — explicitly labeled as a modeling tool the brand populates and owns, not a guaranteed forecast)
- Launch planning (task/timeline view for go-live)
- Expansion dashboard (cross-module summary view — the primary "home" screen for a returning user)

## 6. Non-Goals (MVP)

- Yorkstn does not take title to goods, does not act as importer/distributor of record, and does not process payments between brands and partners in MVP (no marketplace transaction/escrow layer in MVP — a future-phase hypothesis only).
- Yorkstn does not provide legal or tax advice through the software; the Compliance Operating System is a workflow/tracking tool, and any output that could be construed as legal/tax advice is routed to the managed-services/human-advisor layer, consistent with the "not legal advice" disclaimers already established in Phase 1 research.
- No mobile native app in MVP (responsive web only).
- No non-India market support in MVP (architecture should not preclude it, but no second-country data/compliance content ships in MVP).

## 7. Key Assumptions (approved per user direction, 2026-07-23)

These are treated as approved working assumptions unless future verified research overrides them (per the user's explicit instruction). They are still labeled as assumptions, not verified fact, consistent with Phase 1 discipline:

1. The ICP in Section 3 is the right initial wedge.
2. A SaaS-first, services-optional model (Section 4) is the right monetization posture.
3. The four modules in Section 5 are the right MVP scope and no fifth module is needed for MVP.
4. Managed services are attached to, not required by, the compliance and partner-onboarding workflows.

## 8. Success Metrics (MVP — hypotheses, require validation)

Labeled explicitly as hypotheses per Phase 1's "no fabricated stats" rule — none of the following are measured yet:
- Activation: an organization completes an Expansion Readiness Score and a City Recommendation within their first session.
- Engagement: a returning organization opens the Expansion Dashboard at least weekly during an active expansion.
- Compliance value: a Compliance Operating System case (e.g., entity formation) is tracked to completion inside the platform rather than off-platform in spreadsheets/email.
- Partner value: at least one AI partner recommendation per active organization leads to a logged partner contact/introduction.
- These metrics require an actual instrumentation plan — see `docs/phase2/VALIDATION_PLAN.md`.

## 9. Pricing Notes (directional, not committed)

Flagged explicitly as a placeholder for Phase 2 business-model design, not a final pricing decision:
- Tiered subscription by module access + organization size (e.g., "Starter" = Market Intelligence + City Intelligence only; "Growth" = adds Compliance OS + Partner Discovery; "Scale" = adds managed-services credits and multi-brand/multi-entity support).
- Managed services priced per-engagement (entity formation, complex filings) — quote-based, consistent with how Phase 1 found comparable hybrid vendors (Sovos, Flexport) price their services layer.

## 10. Risks (carried from Phase 1)

1. **Regulatory content is a moat that is expensive to build/maintain** (Phase 1 finding) — Yorkstn's Compliance OS must decide, module by module, what to build narrow-and-deep for India vs. license/integrate (e.g., GST/e-invoicing via ClearTax/Cygnet-style partners rather than rebuilding).
2. **Payments/partner-verification infrastructure should partner, not build** — Razorpay for India-inbound payments if/when transaction features are added; no in-house KYC/verification engine should be built before evaluating existing India business-verification data providers (e.g., D&B-style).
3. **Self-service-only may under-deliver for high-stakes early steps** (entity formation, FDI structuring) — the managed-services layer exists specifically to de-risk this, per Section 4.
4. **All regulatory figures in Phase 1 research require re-verification against primary `.gov.in` sources** before being surfaced as authoritative content inside the Compliance OS (see `research/*.md` methodology sections) — the Compliance OS content pipeline must include a "last verified" timestamp and source citation per rule, not just a static checklist.
