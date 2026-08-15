# Yorkstn — Acceptance Criteria

Given/When/Then acceptance criteria for the highest-priority stories in `USER_STORIES.md`, grouped by module. Lower-priority/long-tail stories should follow the same pattern when implemented (see `PRODUCT_BACKLOG.md` for prioritization).

## Onboarding

**US-01 — Create organization + brand profile**
- Given a new signed-up user with no organization, When they complete the onboarding wizard (org name, brand category, home country, price tier), Then an Organization and BrandProfile record are created and the user is redirected to `/dashboard` with a "first session" guided state.
- Given a required field is missing, When the user attempts to submit, Then inline validation blocks submission without a page reload.

**US-02 — Invite members with roles**
- Given an Owner/Admin, When they invite a user by email with a selected role, Then an invitation record is created, an email is sent (or queued — see `AI_ARCHITECTURE.md`/`SECURITY_ARCHITECTURE.md` for email-provider dependency), and the invitee can accept via `/invite/:token` to join with exactly that role.
- Given an invitation token is expired or already used, When visited, Then the user sees an explicit expired/used state, not a silent failure.

## AI Market Intelligence

**US-15 — City Recommendations**
- Given an Organization with a completed BrandProfile, When the user opens `/market-intelligence/cities`, Then a ranked list of cities renders with a per-criterion score breakdown and each city links to its City Intelligence detail page.
- Given the underlying data for a criterion is insufficient for a given category, When the ranking is generated, Then that criterion is marked `insufficient-data` for the affected cities rather than silently defaulted to a numeric score.

**US-16 — Expansion Readiness Score**
- Given an Organization's current Compliance/Market/Capital status, When `/market-intelligence/readiness-score` is opened, Then a 0–100 score renders with a driver breakdown that sums to the total, and the calculation is deterministic (same inputs always produce the same score — verified by a unit test on the scoring function).

**US-17 — AI output citations**
- Given any AI-generated output (market analysis, pricing, demand forecast, competitor list, partner recommendation), When rendered, Then it displays `sources[]` (or an explicit "no external source — flagged as assumption" state), a `confidence` level, and a `generatedAt` timestamp, per the AI Output Standard in `FEATURE_SPECIFICATIONS.md`.

## Compliance Operating System

**US-20 — Entity Formation recommendation**
- Given a user completes the entity-formation questionnaire, When submitted, Then a recommended entity type renders with a rationale referencing the specific questionnaire answers that drove it, and a task checklist is created in the organization's Compliance case.
- Given the same questionnaire answers, When run twice, Then the same entity type is recommended both times (deterministic rules engine — not model-generated).

**US-25 — Document management**
- Given a Compliance workflow item, When a user uploads a document, Then it is stored with a version number, uploader, and timestamp, and previous versions remain retrievable (not overwritten).
- Given a user without Compliance Manager or Owner/Admin role, When they attempt to upload/delete a document, Then the action is rejected (403) per RBAC.

**US-26/27 — Timeline tracking with source dates**
- Given open items exist across Entity Formation, Import, GST, BIS, and Trademark workflows, When `/compliance/overview` is opened, Then all items render in one sortable list by due date, each showing a "last verified" date and source link.
- Given a checklist rule's "last verified" date is older than a configured staleness threshold (e.g., 180 days), When displayed, Then it renders a visible staleness indicator (not silently treated as current) — operationalizing Phase 1's re-verification requirement.

## Partner Discovery

**US-30/31 — Search and verified profiles**
- Given partners exist across multiple categories and verification states, When a user filters by category + city + `verified only`, Then only matching, verified partners render.
- Given a partner profile is `unverified`, When viewed by a brand-side user, Then this is visibly labeled (not visually indistinguishable from `verified`).

**US-32 — AI partner recommendations**
- Given an Organization has an active expansion plan (target city + category), When `/partners/recommendations` is opened, Then ranked matches render with a rationale string listing the specific matching signals used, per the AI Output Standard.

**US-33 — Introduction requests**
- Given a user submits an introduction request to a partner, When submitted, Then a request record is created with status `sent`, both the requesting Organization and the Partner can see its current status, and status changes trigger a notification to the other side.

**US-34/35 — Partner verification workflow**
- Given a Partner-role user submits a profile for verification, When submitted, Then it enters `pending` and is queued for Yorkstn Staff review; it is not visible to brands as `verified` until approved.
- Given a Yorkstn Staff user approves a pending profile, When approved, Then its status changes to `verified` and it becomes visible/filterable as such; given rejection, the partner sees the reason but brands never see rejected submissions.

## Retail Expansion Intelligence

**US-42 — Site selection scoring**
- Given a user adds candidate sites and sets scoring weights, When the workspace recalculates, Then each site's score updates immediately and is reproducible from the same weights/inputs (deterministic scoring function, unit-tested).

**US-44 — Financial projections**
- Given a user enters assumptions (rent, staffing, COGS) alongside platform benchmark ranges, When the projection renders, Then user-entered figures and platform-provided benchmarks are visually distinguished from each other (never merged into one number implying the platform generated the whole projection), consistent with the PRD's non-goal on speculative-financials-as-fact.

**US-46 — Expansion Dashboard**
- Given an Organization with activity across all four modules, When `/dashboard` loads, Then it renders Readiness Score, top-N open Compliance tasks by due date, Partner introduction status counts, and Roadmap milestone progress — each section linking through to its full module view.

## Managed Services

**US-50/51 — Engagement request and tracking**
- Given a user requests a managed-services engagement from a Compliance workflow, When submitted, Then an Engagement record is created linked to that workflow item, visible in `/managed-services` with status `requested`.
- Given a Yorkstn Staff user updates engagement status/notes, When updated, Then the brand-side Organization sees the update in their own dashboard without needing an external email/channel.

## Platform / Cross-cutting

**US-60/61 — RBAC and audit log**
- Given a user's role does not include a given permission (per `AUTH_RBAC.md`'s matrix), When they attempt the corresponding UI action or API call, Then the UI hides/disables the action where feasible and the API independently rejects it (403) — UI-hiding alone is never the enforcement boundary.
- Given any create/update/delete on Compliance, Partner, or Document records, When it occurs, Then an AuditLog entry is written with actor, action, entity, before/after (where applicable), and timestamp, visible at `/settings/audit-log` to Owner/Admin.
