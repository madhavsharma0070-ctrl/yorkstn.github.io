# Yorkstn — Security Architecture

**Phase:** 2 (Product & Architecture Design)
**Depends on:** `SYSTEM_ARCHITECTURE.md`, `TECH_STACK.md`, `INFORMATION_ARCHITECTURE.md` (role matrix), `ACCEPTANCE_CRITERIA.md` (AuditLog acceptance criteria)
**Scope:** Security posture for the authenticated platform. Where a control depends on infrastructure or legal review not yet in place, this document says so explicitly rather than asserting a compliance posture Yorkstn cannot yet back up.

---

## 1. Authentication and session security

- NextAuth.js (Auth.js) is the session/auth layer (per `TECH_STACK.md` §5), backed by the Prisma adapter, storing sessions server-side (database session strategy, not JWT-only) so a session can be revoked server-side (e.g., on suspected compromise, or an offboarded user) rather than living purely as a client-held token until natural expiry.
- Passwords (for the Credentials provider, if used alongside/instead of passwordless email or OAuth) are hashed with a modern adaptive hash (e.g., bcrypt/argon2 via NextAuth.js's supported patterns) — never stored or logged in plaintext, and never included in `AuditLog` payloads.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where flows allow), consistent with NextAuth.js defaults — no custom session-cookie handling that would weaken these defaults.
- Session expiry: a reasonable idle timeout (e.g., re-authenticate after a period of inactivity) balanced against the platform's actual usage pattern (an expansion project run over weeks/months, not a high-security banking session) — exact timeout is a product/UX call for Phase 4, not a fixed requirement here.
- The Partner Portal (`/partner-portal`, a separate app shell per the IA) uses the same NextAuth.js session mechanism but with a Partner role scoped to only that shell's routes — not a separate auth system, to avoid maintaining two authentication implementations.

---

## 2. Authorization: defense-in-depth, enforced at the API layer

**The role matrix in `INFORMATION_ARCHITECTURE.md` §3 is a UX specification, not a security control by itself.** Hiding a sidebar link or disabling a button in the UI does not stop a Compliance Manager's browser from calling an API route reserved for Owner/Admin actions directly. Authorization must therefore be enforced independently at the layer that actually matters:

1. **UI layer** — hides/disables affected controls per the role matrix, purely for usability (don't show a user an action they can't take).
2. **API/route-handler layer (the real control)** — every Route Handler and server action re-checks, from the session, that the caller's Role for the resolved `organizationId` permits the requested action, **before** touching the database. This check lives in a shared `lib/core/authz` helper (e.g., `requireRole(session, organizationId, action)`) called at the top of every mutating (and most reading) handler — not reimplemented ad hoc per route, which is how authorization bugs creep in.
3. **Data layer** — as a last line of defense, tenant-scoping (§3) means even a bug that skipped the role check still cannot return another organization's data, because every query is scoped by `organizationId` regardless of role outcome.

Every role transition implied by the IA's matrix (e.g., a Viewer attempting a write anywhere, a Compliance Manager attempting an Owner-only Settings action, a Partner-role user attempting to read another partner's verification documents) must have this checked in the API layer, and ideally covered by a test asserting the API rejects it even if a hypothetical malicious client bypassed the UI entirely. This is the concrete meaning of "RBAC enforced," not just "roles exist in the data model."

---

## 3. Tenant data isolation — the single most important invariant

Yorkstn is multi-tenant: many Organizations share one application and one database. **The single most important security invariant in this system is that every database query touching organization-scoped data includes an `organizationId` filter that matches the authenticated session's authorized organization(s) — with no exceptions, including for Yorkstn Staff, whose access is itself scoped to *assigned* organizations, not a blanket bypass.**

Concrete enforcement approach:
- Every Prisma model that holds organization-scoped data (Brand Profile, Compliance Workflow Item, AiInsight, Document, Partner introduction request, etc.) carries an `organizationId` foreign key.
- Data access goes through module-level functions (per `SYSTEM_ARCHITECTURE.md` §1's `lib/modules/*` boundary) that **require** an `organizationId` parameter derived from the authenticated session — never from a raw client-supplied value trusted at face value (e.g., never `WHERE id = :routeParam` alone; always `WHERE id = :routeParam AND organizationId = :sessionOrgId`), which prevents the classic IDOR (insecure direct object reference) bug of one org guessing/enumerating another org's record IDs.
- The org-switcher (IA §4) changes which `organizationId` the session is scoped to for a request; it must re-validate that the target user is actually a member of the requested organization at switch time, not just trust a client-sent org ID.
- Yorkstn Staff (Admin routes, `/admin/*`) access is scoped to organizations they are explicitly assigned to review — the "assigned orgs" language in the IA's role matrix must be a real filter (an `OrganizationAssignment` join, or equivalent), not a comment; staff access is broad-but-scoped, never global-unscoped, by default.
- **Recommended practice for Phase 4:** centralize the "scoped query" pattern in one or a small number of data-access helpers per module so tenant-scoping cannot be forgotten in a one-off query written under time pressure. A missed `organizationId` filter is the single highest-consequence class of bug this platform can ship.

---

## 4. Secrets management

- **Local development:** environment variables via `.env.local` (git-ignored, consistent with Next.js convention) — `DATABASE_URL` (SQLite path), `NEXTAUTH_SECRET`, `AI_PROVIDER=mock` (no key needed for the default mock provider per `AI_ARCHITECTURE.md`), SES credentials (already required today for the existing contact form).
- **Staging/production:** environment variables should be managed via **AWS Amplify's environment variable configuration** (already the deployment mechanism, so no new secrets-management product needs to be introduced for MVP) for values that aren't especially sensitive at rest, and **AWS Secrets Manager** (or Amplify's own encrypted variable storage, which is often sufficient at this scale) for higher-sensitivity values (production `DATABASE_URL` with credentials, `NEXTAUTH_SECRET`, S3 IAM credentials, any real LLM API key once provisioned). Given the AWS-centric stack already in place (Amplify, SES), staying within AWS's secrets tooling avoids introducing a new vendor (e.g., HashiCorp Vault) that would be disproportionate to this team's size and stage.
- **Requires credentials:** none of the above (Amplify env vars for secrets, AWS Secrets Manager) are configured in this environment yet — this is explicitly a provisioning task for Yorkstn's team, listed in `DEPLOYMENT_ARCHITECTURE.md`'s checklist, not something to fabricate access to.
- No secret is ever committed to the repo, logged, or written into `AuditLog` payloads. Code review / CI should include a basic secret-scanning check (many CI providers offer this for free) as a backstop.

---

## 5. Encryption

- **At rest:** rely on the managed services' native encryption — AWS RDS/Aurora Postgres encryption-at-rest, and S3 server-side encryption (SSE-S3 or SSE-KMS) for uploaded documents. This is standard, low-effort, and appropriate; there is no product requirement here (e.g., no field-level encryption need identified in the PRD) that justifies building custom application-level encryption on top, which would add complexity and key-management burden disproportionate to MVP risk.
- **In transit:** TLS everywhere — Amplify-hosted traffic is TLS by default, database connections use TLS (`sslmode=require` or equivalent for the Postgres connection string), S3 access is over HTTPS. Standard configuration, not a custom control.
- Do not over-engineer this: MVP's realistic threat model does not require, e.g., client-side end-to-end encryption of documents — the data involved (business/compliance filings, partner profiles) is sensitive commercially but is the kind of data any B2B SaaS platform holds behind standard managed-service encryption plus proper access control (§2, §3), not a healthcare/financial-account-number-grade encryption requirement.

---

## 6. File upload security (Document Management, §2.6; Partner verification documents, §3.5)

- **File type validation:** allow-list validation (not deny-list) of accepted MIME types/extensions server-side (e.g., PDF, common image formats, common office document formats for filings/certificates) — validated by inspecting actual file content/magic bytes where practical, not just the client-supplied filename extension or `Content-Type` header, which a malicious client can spoof.
- **Size limits:** enforce a maximum upload size per file server-side (exact limit is a product call for Phase 4 — a reasonable default like 25MB per document is a sane MVP starting point) to bound storage cost and reduce denial-of-service surface.
- **Malware scanning: flagged as "Requires further validation / external service."** MVP does not build a custom malware-scanning engine; the recommended integration point is a managed scanning service (e.g., ClamAV run as a Lambda-triggered scan on S3 upload, or a hosted scanning API) invoked as a background job (per `SYSTEM_ARCHITECTURE.md` §4's document-processing job) after upload and before a document is marked available/downloadable to other users. Until this integration is provisioned, uploaded files should still be stored with the type/size validation above as a baseline, with the malware-scan gap documented rather than silently absent.
- **Access control:** documents are never served from a public S3 URL. Access goes through **signed, time-expiring URLs** generated server-side after an authorization check (the requesting user's role + organization must have access to the specific workflow item/document per §2 and §3) — a short expiry (e.g., minutes, not hours) so a leaked link has a small exploitation window. No document URL should be guessable or long-lived.

---

## 7. Input validation

**Recommendation: Zod** as the schema-validation library at every API boundary (Route Handlers and server actions). Every request body, query param set, and form submission is parsed through a Zod schema before touching any business logic — rejecting malformed/unexpected input at the edge rather than trusting client input to already be well-formed. This also gives a natural place to enforce type constraints that TypeScript alone can't guarantee at runtime (e.g., an HSN code format, an enum value for verification status), and pairs naturally with Prisma's generated types for end-to-end type safety consistent with the existing strict-TypeScript convention.

---

## 8. Rate limiting

MVP-appropriate, not enterprise-grade: apply rate limiting to the handful of routes with real abuse potential — authentication endpoints (login/password-reset, to blunt credential-stuffing/brute-force), the contact/introduction-request flow (to blunt spam), and any AI-generation-triggering endpoint (to bound cost once a real LLM provider is wired in, per `AI_ARCHITECTURE.md`). A simple approach appropriate to the serverless/Amplify hosting model: a Postgres-backed or in-memory-per-instance sliding-window counter for MVP traffic levels, with the option to move to a dedicated rate-limiting service (e.g., Upstash Redis-backed limiter) later if traffic characteristics demand it — not a justification to add Redis at MVP purely for this (consistent with `SYSTEM_ARCHITECTURE.md` §5's caching stance).

---

## 9. Audit logging

Per `ACCEPTANCE_CRITERIA.md` (US-60/61): "Given any create/update/delete on Compliance, Partner, or Document records, When it occurs, Then an `AuditLog` entry is written with actor, action, entity, before/after (where applicable), and timestamp, visible at `/settings/audit-log` to Owner/Admin."

Implementation notes:
- `AuditLog` writes should happen at the same data-access-helper layer that enforces tenant scoping (§3) — i.e., the module service function that performs a mutation is also responsible for writing its audit entry, so audit coverage can't be silently skipped by a route that forgets to call a separate logging step. A thin wrapper (e.g., `withAudit(fn)` around a mutation) is a reasonable pattern to make this hard to forget.
- Audit entries record `actorId`, `organizationId`, `action` (create/update/delete + entity type), `entityId`, a `before`/`after` diff where applicable (redacting any secret/sensitive field, e.g., never storing raw document contents or password fields in the diff), and `timestamp`.
- Audit logs are themselves organization-scoped and read-only to end users (Owner/Admin can view, per the IA's matrix; no user, including Owner/Admin, can edit or delete existing audit entries — otherwise the log isn't trustworthy as an audit trail).
- Coverage per the acceptance criteria is Compliance, Partner, and Document records at minimum; extending this to Expansion and Market Intelligence writes (e.g., a readiness-score recomputation) is a reasonable Phase 4 addition but not a hard MVP requirement per the stated acceptance criteria.

---

## 10. Data retention and deletion (org offboarding)

- When an Organization offboards (subscription ends, account closed), the platform needs a defined deletion/retention behavior rather than an ad hoc one. Recommended MVP approach: a soft-delete/deactivation state first (organization marked inactive, access revoked, data retained for a bounded grace period — e.g., 30-90 days, exact figure a business/legal call, not asserted here as final), followed by hard deletion of organization-scoped data (or anonymization, if any aggregate/benchmark data was derived from it) at the end of that window, triggered by an explicit admin action or scheduled job, not silently.
- Documents in S3 for an offboarded organization should be deleted (or moved to a clearly separate, time-bounded "pending deletion" storage tier) in the same window as the database records, to avoid orphaned sensitive files outstanding in storage indefinitely.
- Backups: whatever managed-Postgres backup mechanism is used (e.g., RDS automated snapshots) will retain deleted data for the backup-retention window regardless of application-level deletion — this should be disclosed rather than implying deletion is instantaneous and total across all storage tiers, including backups.
- Exact retention periods, and whether any anonymized aggregate data is retained past offboarding for product-analytics purposes, are policy decisions that should be reviewed with counsel (see §11) before being finalized as a public commitment (e.g., in a Terms of Service or Privacy Policy) — this document specifies the mechanism, not the final legal commitment.

---

## 11. India-specific compliance: DPDP Act 2023 applies to Yorkstn itself, not only as content it displays

This is an important distinction that must not be lost: the Compliance Operating System module *displays regulatory content to brand customers* (e.g., DGFT/BIS/GST rules), but separately, **Yorkstn as a company is itself a Data Fiduciary under India's Digital Personal Data Protection Act (DPDP) 2023** with respect to the personal data it processes through its own platform — including Indian partners' personal/business contact data (Partner Discovery Platform, §3), Indian users' account data, and any personal data collected via the platform generally, regardless of where Yorkstn or its customer-brands are headquartered.

This is flagged, not asserted as already handled:
- **Requires further validation with counsel** — the specific DPDP obligations that apply (consent mechanics, data principal rights request handling, cross-border data transfer restrictions if any data is processed/stored outside India, breach notification timelines, Data Protection Board registration if applicable, "Significant Data Fiduciary" thresholds if Yorkstn's scale ever approaches them) should be confirmed with qualified counsel before Yorkstn asserts a specific DPDP compliance posture publicly (e.g., in a Privacy Policy) or to enterprise customers doing vendor security review.
- This is architecturally distinct from, and in addition to, the Compliance OS module's job of tracking DPDP-related obligations *for the brand customer's own India operations* — Yorkstn's obligations as a platform operator exist independently of what it tells its customers about their obligations.
- Practical architecture implications that are reasonable to build now, ahead of final legal sign-off, because they're good practice regardless of the exact DPDP requirements: the tenant-isolation (§3), access-control (§2), audit-logging (§9), and data-retention (§10) mechanisms above are the same technical controls a DPDP-conscious posture would require, so building them well for security reasons also positions Yorkstn reasonably for compliance review — but the specific legal posture (required notices, consent flows, grievance-officer designation, etc.) is a distinct workstream requiring counsel, not something this architecture document can respond for.
