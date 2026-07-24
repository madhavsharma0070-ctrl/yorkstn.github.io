# Engineering Spec — Compliance Operating System Module

**Depends on:** `docs/phase2/FEATURE_SPECIFICATIONS.md` §Module 2, `docs/phase2/DATABASE_SCHEMA.md` §1.4, `docs/phase2/API_SPECIFICATION.md` §4, `docs/phase2/SECURITY_ARCHITECTURE.md` (file upload security), `docs/phase2/MVP_ROADMAP.md` (Milestones 2–3).

## 1. Module boundary

```
lib/modules/compliance/
├── entity-formation/
│   ├── rules-engine.ts           # pure function: (questionnaire answers) => { recommendedEntityType, rationale, ruleEngineVersion, checklistItems[] }
│   └── checklist-templates.ts    # per-entity-type task templates (SPICe+, FC-1, etc. — content sourced from research/india-market-entry-regulatory-landscape.md §2)
├── import/
│   └── hsn-lookup.service.ts     # Category (b) curated lookup: HSN code -> {IEC steps, DGFT/CBIC steps, BIS/QCO flag, labelling reqs}
├── gst/
│   └── state-registration.service.ts  # derives required-state list from the org's site/warehouse footprint (reads Expansion module's sites, read-only)
├── bis/
│   └── qco-lookup.service.ts     # QCO/FMCS/CRS applicability by product/HSN
├── trademark/
│   └── ip-timeline.service.ts    # status-stage tracker (search->filing->examination->publication->opposition->registration)
├── documents/
│   ├── storage.adapter.ts        # interface; local-filesystem impl for dev, S3 impl for staging/prod (env-switched, D-09-style pattern)
│   └── versioning.service.ts     # enforces "new version = new row, never overwritten" (DATABASE_SCHEMA.md §1.4)
├── timeline.service.ts           # cross-workflow aggregation query for /compliance/overview
└── content-staleness.ts          # computes the "last verified" staleness indicator (AC US-27) from content_last_verified_at

app/app/compliance/**
app/api/v1/compliance/**
```

## 2. Prisma models owned

`compliance_cases`, `compliance_workflow_items`, `documents`, `document_versions` (per `DATABASE_SCHEMA.md` §1.4). `documents`/`document_versions` are also referenced by the Partner Discovery module for verification uploads (`attached_to_type='partner_verification'`) — per `DECISIONS.md` D-13, that cross-reference is **application-enforced only** (no DB FK across the polymorphic boundary), so both modules' code must independently validate `attached_to_id` resolves to a record they're each authorized to see before serving a document.

## 3. API routes owned

The full `/compliance/**` group from `API_SPECIFICATION.md` §4, including the HSN-lookup endpoint.

## 4. The determinism boundary for this module

`entity-formation/rules-engine.ts` is the highest-consequence deterministic function in the product (a real legal-structure recommendation) and must satisfy the same purity requirement as the Readiness Score's scoring engine (§5 of the Market Intelligence spec): no I/O, no AI call, versioned (`ruleEngineVersion`) so that a future rule change doesn't silently alter what was recommended to an org last month — old recommendations keep the `ruleEngineVersion` they were generated with, and re-running the questionnaire generates a *new* `compliance_workflow_items` entry-formation record rather than mutating history. `hsn-lookup.service.ts`, `qco-lookup.service.ts` are Category (b) per `AI_ARCHITECTURE.md` — plain versioned lookup tables, never an LLM call, for the same reason a wrong entity-type or wrong certification requirement has real legal/financial consequence.

## 5. Document upload security (implementation detail beyond `SECURITY_ARCHITECTURE.md`'s policy statement)

- MIME-type allowlist enforced server-side (not just client `accept=` attribute): PDF, DOCX, PNG, JPG.
- Max size: 25MB per file (configurable), rejected with `VALIDATION_ERROR` before the upload stream is fully consumed where feasible.
- Malware scanning is explicitly **Category (d)-equivalent for this module** — flagged in `SECURITY_ARCHITECTURE.md` as "Requires further validation / external service" (e.g., ClamAV sidecar or a cloud scanning API) — MVP ships **without** it, clearly documented as a pre-production gap in `DEPLOYMENT_ARCHITECTURE.md` §8, not silently skipped.
- Read access is via short-lived signed URLs generated per request (S3 presigned URL in prod; a locally-signed token in the dev local-filesystem adapter) — raw storage paths are never returned directly to the client.

## 6. Test plan

- **Unit:** `rules-engine.ts` — one test per representative questionnaire-answer combination asserting the exact expected `recommendedEntityType` (a decision table test, given the finite, enumerable input space per `research/india-market-entry-regulatory-landscape.md` §2); determinism test (same input twice → identical output including `rationale` string).
- **Unit:** `versioning.service.ts` — uploading twice to the same `document_group_id` produces `version` 1 then 2, and version 1 remains fetchable.
- **Integration:** RBAC test — `viewer`/`analyst_editor` get 403 on document upload and workflow-item edit (only `compliance_manager`/`owner`/`admin` per `AUTH_RBAC.md` §2); `content-staleness.ts` renders the staleness flag when a fixture's `content_last_verified_at` is set beyond the threshold.
- **Cross-module:** GST state-registration test asserting a new `sites` row in a previously-unregistered state correctly flags a new required GST registration (exercises the Expansion→Compliance read boundary, currently stubbed until Milestone 7 per `MILESTONES.md` Milestone 3's explicit note — this test should initially assert the stub behavior, then be updated once Milestone 7 lands).

## 7. Build-order note

Milestones 2 (Entity Formation vertical slice) and 3 (remaining workflows + timeline) — no reordering from `MVP_ROADMAP.md`. Milestone 2 is deliberately first among all four modules (ahead of even the AI service layer) because it is fully deterministic and has zero AI dependency, making it the lowest-risk way to prove out the Document Management + task/due-date/RBAC pattern every later module reuses.
