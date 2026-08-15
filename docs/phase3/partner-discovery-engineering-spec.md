# Engineering Spec — Partner Discovery Platform Module

**Depends on:** `docs/phase2/FEATURE_SPECIFICATIONS.md` §Module 3, `docs/phase2/DATABASE_SCHEMA.md` §1.5, `docs/phase2/API_SPECIFICATION.md` §5, `docs/phase2/AUTH_RBAC.md` §4 (partner isolation), `docs/phase2/SYSTEM_ARCHITECTURE.md` §6 (search), `docs/phase2/MVP_ROADMAP.md` (Milestone 6).

## 1. Module boundary

```
lib/modules/partners/
├── directory/
│   ├── search.service.ts          # Postgres full-text search per SYSTEM_ARCHITECTURE.md §6 — category+city+verification-status filter, matches API_SPECIFICATION.md §5's exact filter set
│   └── profile.service.ts         # read/update partner profile, strips rejectionReason/internal review history for non-staff callers
├── verification/
│   ├── submission.service.ts      # partner-side profile+document submission -> partner_verifications row, status='pending'
│   └── review-queue.service.ts    # yorkstn_staff approve/reject -> updates partners.verification_status (denormalized) + partner_verifications history
├── introductions/
│   └── introduction-request.service.ts   # create/list/status-transition, both-sides visibility, triggers notifications
└── recommendations/
    └── partner-matching.service.ts  # deterministic matching-signal computation (city match, category match, verification status) + narrative via lib/modules/market-intelligence/ai-provider (shared interface, §2 of that spec)

app/app/partners/**            # brand-side UI
app/partner-portal/**          # separate app shell, partner-role UI (AUTH_RBAC.md §4 isolation)
app/api/v1/partners/**
app/api/v1/partner-portal/**
app/api/v1/admin/partner-verification-queue/**
```

**Why `partner-matching.service.ts` is split deterministic-signals + AI-narrative, not one AI call:** per `FEATURE_SPECIFICATIONS.md` §3.3 and `AI_ARCHITECTURE.md`'s category split, *which* partners match is a deterministic computation (city/category/verification-status overlap — Category (c)), while the human-readable *rationale string* explaining the match is the one piece worth generating via `AiProvider` (Category (a), reusing the Market Intelligence module's provider interface rather than building a second one). This avoids the failure mode of an LLM inventing a match that isn't actually supported by the underlying data.

## 2. Prisma models owned

`partners`, `partner_cities`, `partner_references`, `partner_verifications`, `introduction_requests` (per `DATABASE_SCHEMA.md` §1.5). Note from `DECISIONS.md` D-14: `partners` is **not** tenant-scoped (a shared directory) — every query here filters by `category`/`verification_status`/etc., never by `organization_id`, except `introduction_requests` which *is* org-scoped (it's the brand-side org's outreach record).

## 3. API routes owned

The full `/partners/**`, `/partner-portal/**`, and `/admin/partner-verification-queue/**` groups from `API_SPECIFICATION.md` §5, plus the *service* backing `/market-intelligence/partner-recommendations` (route URL owned by the Market Intelligence module per that spec's §4, service logic owned here).

## 4. Partner isolation — implementation detail beyond `AUTH_RBAC.md`'s policy statement

Every `/partner-portal/**` route handler's **first line** must resolve `session.userId → partners.id` via the unique `contact_user_id` FK before any query executes, and every subsequent query in that handler is scoped to that single resolved `partner_id` — implemented as a shared middleware/helper (`resolveOwnPartnerId(session)`) so this can't be forgotten per-route, mirroring the `requirePermission` pattern from `AUTH_RBAC.md` §5. A partner session must never be able to reach `/partners/**` (the brand-side directory route group) or any `organizations`-scoped table — enforced by a route-group-level guard in the Next.js middleware, not just per-handler checks, as defense in depth.

## 5. Verification-review visibility rule (the one subtle bug risk in this module)

`partners.verification_status` (public, brand-visible: `unverified`/`pending`/`verified`) and `partner_verifications.rejection_reason` (partner-visible only, never brand-visible) must be read through **two separate service functions** with different authorization contexts (`profile.service.ts`'s brand-facing read vs. the partner-portal's own-profile read) — never one function with a conditional field-strip, since a conditional strip is exactly the kind of thing that gets missed when a new field is added later. This is worth calling out explicitly because AC US-34/35 and `DATABASE_SCHEMA.md` §1.5 both flag this as a hard visibility rule, not a nice-to-have.

## 6. Test plan

- **Unit:** `partner-matching.service.ts`'s deterministic signal computation — given fixed org profile + partner fixtures, matching signals and ranking are reproducible.
- **Integration:** partner-portal isolation test — a partner session attempting to `GET /partners` (brand-side route) or query another partner's data gets 403/404, not partial data; verification-queue test — `yorkstn_staff` approve/reject correctly updates both `partners.verification_status` and creates a `partner_verifications` row; brand-side query for a rejected/pending partner never includes `rejection_reason`.
- **Integration:** introduction-request status-transition test (`sent → partner_viewed → accepted/declined`) with notification fan-out to both sides.

## 7. Build-order note

Milestone 6, per `MVP_ROADMAP.md` — depends on Milestone 1 (RBAC, Partner as a distinct role) fully, and on Milestone 4/5 (AI service layer + expansion-plan data) only for the AI Partner Recommendations sub-feature; the directory/search/verification core can and should be built and demoed against Milestone 1 alone if Milestone 4/5 slip, per the roadmap's explicit "no milestone should block on AI-generation being ready before the deterministic core value exists" principle (implicit in `MVP_ROADMAP.md`'s sequencing, made explicit here for this module).
