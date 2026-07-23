# Yorkstn — User Personas

Personas are grounded in the ICP and modules defined in `docs/phase2/PRD.md`. Each persona maps to one or more RBAC roles defined in `docs/phase2/AUTH_RBAC.md`.

---

## 1. Priya Nair — VP International Expansion (Primary buyer, larger org)
- **Org type:** Mid-size international lifestyle/beauty brand ($20–150M revenue), HQ outside India, evaluating India as a new market.
- **Role in system:** Organization Owner / Admin
- **Goals:** Decide *whether and where* to enter India with defensible, cited data; get a board-ready expansion case; avoid an expensive MBB engagement for a decision that may turn out "not yet."
- **Pain points (from Phase 1 research):** Existing tools are point solutions (location intelligence *or* pricing intelligence *or* compliance, never combined); demand-forecasting tools assume operating history her brand doesn't have in India.
- **Primary modules:** AI Market Intelligence (heaviest use), Retail Expansion Intelligence (dashboard, financial projections), light touch on Compliance OS (oversight, not data entry).
- **Success looks like:** A city-ranked shortlist and expansion readiness score she can present internally within her first working session.

## 2. Arjun Mehta — Compliance & Legal Manager
- **Org type:** Same organization as Priya, or a contracted compliance lead; sometimes a Yorkstn managed-services advisor acting on the brand's behalf.
- **Role in system:** Compliance Manager
- **Goals:** Track every regulatory workstream (entity formation, IEC, GST, BIS, trademark) to completion with an audit trail; know what changed in Indian regulation since last check-in.
- **Pain points:** India's regulatory environment is fragmented and fast-changing (GST 2.0, four new Labour Codes, 2026 CBIC circulars); no single system of record exists today — tracked in spreadsheets/email per Phase 1 research's advisory-segment findings.
- **Primary modules:** Compliance Operating System (heaviest use — workflow completion, document upload, timeline tracking), light touch on Partner Discovery (verifying legal/CRE partners).
- **Success looks like:** Every open compliance task has an owner, a due date, a document, and a "last verified against source" date.

## 3. Meera Kapoor — Retail Operations Analyst
- **Org type:** Same organization; the day-to-day operator once a market-entry decision is made.
- **Role in system:** Analyst / Editor
- **Goals:** Turn the expansion decision into an executable plan — shortlist cities/malls/sites, find and vet partners, build the launch timeline.
- **Pain points:** Distributor/partner discovery for foreign entrants is the least-served category found in Phase 1 research; existing B2B marketplaces are optimized for domestic sourcing, not foreign-brand retail partner vetting.
- **Primary modules:** Retail Expansion Intelligence (site selection, launch planning) and Partner Discovery (heaviest use — search, compare, request introductions).
- **Success looks like:** A ranked, verified partner shortlist per category (manufacturer, distributor, mall operator, logistics) she can act on without leaving the platform.

## 4. Daniel Osei — Founder/CEO, smaller specialty brand (self-serve motion)
- **Org type:** Smaller specialty consumer brand ($1–20M revenue), wears the VP-international, compliance, and ops roles simultaneously; cannot afford a dedicated team or an MBB engagement.
- **Role in system:** Organization Owner (all-modules)
- **Goals:** Get a credible, low-cost first read on India feasibility; understand what he doesn't know; use managed services selectively for the one or two steps he genuinely cannot self-serve (e.g., entity formation).
- **Pain points:** Government trade-promotion agencies (JETRO/KOTRA-equivalent thinking) are free but not focused on inbound-to-India; premium advisory is out of budget; needs a bottom-up, transparent-pricing, self-signup experience (per Phase 1's HubSpot/ImportGenius-style architectural inference).
- **Primary modules:** All four, in sequence, single-user.
- **Success looks like:** A clear, affordable path from "curious" to "have an entity and a first city shortlist" without needing to hire a team first.

## 5. Ananya Sharma — Yorkstn Internal Advisor/Analyst
- **Org type:** N/A — internal Yorkstn staff supporting the managed-services layer and platform data quality.
- **Role in system:** Yorkstn Staff (internal role, cross-organization visibility scoped by assignment)
- **Goals:** Deliver managed-services engagements (entity formation execution, complex filings) attached to specific organizations' Compliance OS cases; curate and verify Partner Discovery profiles; keep Compliance OS content sources current.
- **Pain points:** Needs cross-org visibility without breaking tenant isolation; needs an internal-only verification workflow for partner profiles distinct from what brand-side users see.
- **Primary modules:** Compliance OS (case management across assigned orgs), Partner Discovery (verification/curation back-office), platform-wide audit log.
- **Success looks like:** Every managed-services engagement has a clear scope, status, and linked deliverable inside the same system the brand sees, not a side channel.

## 6. Verified Partner — Rohan Furnishings Pvt. Ltd. (secondary user type)
- **Org type:** An Indian manufacturer/distributor/CRE agent/logistics provider seeking to be discovered by international brands.
- **Role in system:** Partner (lightweight, separate portal — not an Organization member)
- **Goals:** Get verified and listed; receive qualified introduction requests from brands whose category/scale match their business.
- **Pain points:** Existing B2B marketplaces (IndiaMART, TradeIndia) are lead-generation directories with no differentiation by foreign-brand-readiness (e.g., export documentation, English-language capability, minimum order quantities suited to a new entrant).
- **Primary modules:** Partner Discovery only (self-service profile management; no access to any brand's Organization data beyond an introduction they were matched to).
- **Success looks like:** A completed verification profile results in qualified, relevant introduction requests, not spam.
