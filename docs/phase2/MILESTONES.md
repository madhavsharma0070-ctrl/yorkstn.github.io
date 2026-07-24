# Yorkstn — Milestones (Definition of Done)

**Depends on:** `MVP_ROADMAP.md` (sequencing/dependency rationale — this document restates the same 8 milestones as a checkable exit-criteria list, the single source of truth for "what does done mean" that Phase 4 self-checks against without a human in the loop at every step).

Each milestone's DoD is written so it can be mechanically checked (does the test suite pass, does the route return the right shape, does RBAC reject the right roles) rather than judged subjectively. "Done" always means: implemented, RBAC-enforced at the API layer (not just UI-hidden), covered by at least one automated test, and documented (a short note in `CHANGELOG.md` plus any doc updates the change implies).

---

## Milestone 1 — Platform Foundation
**DONE WHEN:**
- [ ] A user can sign up, log in, log out (NextAuth.js credentials + JWT session, per `AUTH_RBAC.md`).
- [ ] Onboarding creates an `organizations` row, a `brand_profiles` row, and an `owner` `memberships` row for the creator (US-01).
- [ ] Owner/Admin can invite a member by email + role; invitee can accept via `/invite/:token` and lands with exactly that role (US-02).
- [ ] The full RBAC matrix (`AUTH_RBAC.md` §2) is enforced by a single shared `requirePermission` helper, exercised by an automated test per role × a representative mutating action, asserting 403 for roles that should be denied.
- [ ] Organization-switcher works for a user in 2+ orgs; active `organizationId` lives in session, never a client-supplied param (verified by a test attempting to pass a foreign `organizationId` and asserting rejection).
- [ ] Seed script populates: 1 demo organization, 5 demo users (one per role), reference `cities`/`malls` rows (from `research/india-market-entry-regulatory-landscape.md` content), and a stub Partner directory.
- [ ] `/dashboard` renders an empty/first-session state (no fabricated data) for a brand-new organization.

## Milestone 2 — Compliance OS: Entity Formation (first vertical slice)
**DONE WHEN:**
- [ ] Entity-formation questionnaire → deterministic rules-engine recommendation (WOS/JV/LLP/Branch/Liaison/Project Office), with a rationale string referencing the specific answers that drove it (US-20); a unit test asserts the same inputs always produce the same output.
- [ ] Recommendation auto-creates a task checklist as `compliance_workflow_items` rows.
- [ ] Document upload/versioning works end-to-end against this one workflow (US-25): upload creates a new `document_versions` row, prior versions remain retrievable, non-authorized roles get 403 on upload/delete.
- [ ] Every rule/checklist item displays a `last_verified_at` date and `source_url`; a staleness indicator renders when past a configured threshold (US-27).

## Milestone 3 — Compliance OS: remaining workflows + cross-workflow timeline
**DONE WHEN:**
- [ ] Import (HSN-scoped checklist), GST (per-state tracker), BIS (QCO/FMCS/CRS status), and Trademark/IP (search→registration timeline) workflows all use the same `compliance_workflow_items` pattern proven in Milestone 2 (US-21–24).
- [ ] `/compliance/overview` aggregates all open items across all 5 workflow types into one due-date-sorted list (US-26).
- [ ] GST workflow correctly flags a new state-registration requirement when a new site/warehouse is added elsewhere in the platform (reads from Retail Expansion Intelligence's `sites`, once Milestone 7 exists — until then, this integration point is stubbed with a documented TODO, not silently skipped).

## Milestone 4 — AI Service Layer (shared infrastructure, no user-facing feature yet)
**DONE WHEN:**
- [ ] A provider-agnostic AI service interface exists (`AI_ARCHITECTURE.md`'s design) with a deterministic **mock provider** as the default implementation (no real LLM API key required to demo MVP).
- [ ] The mock provider's outputs conform exactly to the AI Output Standard shape (`summary`/`confidence`/`sources[]`/`assumptions[]`/`generatedAt`/`modelVersion`) so downstream features never need to special-case "mock vs. real."
- [ ] A documented environment-variable swap (e.g., `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`) is wired but **not required** for the MVP demo to function — this milestone explicitly does not block on a real API key being available in this environment.
- [ ] RAG retrieval scaffolding exists over the curated Phase 1 research corpus + seeded category/city content, even if the retrieval corpus is small in MVP.

## Milestone 5 — AI Market Intelligence module
**DONE WHEN:**
- [ ] All of Market Analysis, Consumer Insights, Competitor Intelligence, Pricing Intelligence, Demand Forecasting, and City Recommendations render via the AI service layer (mock provider), each showing sources/confidence/assumptions in the UI (US-10–15, US-17).
- [ ] Demand Forecasting's response is explicitly labeled `methodology: proxy-based (no first-party sales history)` (US-14).
- [ ] Expansion Readiness Score is deterministic (unit-tested for reproducibility) and reads real Compliance-completion state from Milestones 2–3 (US-16).

## Milestone 6 — Partner Discovery Platform
**DONE WHEN:**
- [ ] Search/filter by category + city + verification status works against seeded partner data (US-30).
- [ ] Unverified partners are visibly labeled as such, never visually indistinguishable from verified (US-31).
- [ ] Partner self-service profile + verification submission flow works in the separate `/partner-portal` shell, isolated per `AUTH_RBAC.md` §4 (US-34).
- [ ] Yorkstn Staff verification queue approve/reject flow works and correctly hides rejection reasons from brand-side users (US-35).
- [ ] Introduction requests can be sent, tracked, and status-updated by both sides (US-33).
- [ ] AI Partner Recommendations (via Milestone 4's service layer) renders ranked matches with rationale (US-32).

## Milestone 7 — Retail Expansion Intelligence (aggregating module, deliberately last)
**DONE WHEN:**
- [ ] City Intelligence and Mall Intelligence detail pages render from seeded reference data (US-40, US-41).
- [ ] Site Selection scoring is deterministic and reproducible from the same weights (unit-tested, US-42).
- [ ] Expansion Roadmap renders the 5-phase sequenced plan and reflects real status from Compliance/Partner modules where linked (US-43).
- [ ] Financial Projections visually separates user-entered assumptions from platform benchmark ranges — never merges them into one implied "the platform generated this forecast" number (US-44).
- [ ] Launch Planning task view works (US-45).
- [ ] `/dashboard` (Expansion Dashboard) aggregates Readiness Score + top open Compliance items + Partner request status + Roadmap progress in one composed API call (US-46).

## Milestone 8 — Managed Services + cross-cutting hardening
**DONE WHEN:**
- [ ] Managed-services engagement request/tracking works end-to-end from a Compliance workflow item (US-50, US-51).
- [ ] Every mutating endpoint across all modules writes an `audit_logs` row (actor, action, entity, before/after) — verified by a test sweep across route handlers, not spot-checked ad hoc (US-61).
- [ ] The full RBAC matrix is re-verified exhaustively now that every mutating surface in the product exists (not just Milestone 1's initial subset).
- [ ] A documented "credentials/infra required for production" checklist (from `DEPLOYMENT_ARCHITECTURE.md`) is up to date and matches what's actually still mocked/stubbed at this point.

---

## Cross-milestone notes
- No milestone above requires a real external credential (LLM API key, production Postgres, S3, payment processor) to demonstrate a fully functional MVP — this mirrors `MVP_ROADMAP.md`'s explicit design goal. Each such dependency is called out inline where relevant and tracked in `DEPLOYMENT_ARCHITECTURE.md`'s provisioning checklist, never silently assumed.
- "Automated test" above means at minimum: one unit test for deterministic logic (scoring, entity recommendation, RBAC helper) and one integration/route test for API contracts — see `TECH_STACK.md` for the Vitest/Playwright setup this assumes.
