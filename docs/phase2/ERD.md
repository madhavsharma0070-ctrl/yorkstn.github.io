# Yorkstn — Entity Relationship Diagram

**Depends on:** `DATABASE_SCHEMA.md` (source of truth for column-level detail — this document visualizes its relationships and must be kept in sync with it, not treated as an independent design).

Rendered as four clustered Mermaid `erDiagram` blocks rather than one monolithic diagram — `DATABASE_SCHEMA.md` §1 groups tables into six sub-sections (Identity & Tenancy, Brand Profile, AI Market Intelligence, Compliance OS, Partner Discovery, Retail Expansion Intelligence) and a single diagram of all ~33 tables would be unreadable. Cross-cluster relationships (the FKs that connect one cluster to another) are called out in prose under each diagram instead of drawn twice.

---

## 1. Identity & Tenancy cluster

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ MEMBERSHIPS : has
    ORGANIZATIONS ||--o{ INVITATIONS : has
    ORGANIZATIONS ||--o{ STAFF_ORG_ASSIGNMENTS : "assigned to"
    ORGANIZATIONS ||--|| BRAND_PROFILES : has
    USERS ||--o{ MEMBERSHIPS : holds
    USERS ||--o{ STAFF_ORG_ASSIGNMENTS : "assigned via"
    USERS ||--o| PARTNERS : "is contact for"
    USERS ||--o{ INVITATIONS : "invited by"

    ORGANIZATIONS {
        uuid id PK
        text name
        text slug
        subscription_tier subscription_tier
        billing_status billing_status
    }
    USERS {
        uuid id PK
        citext email
        user_type user_type
        uuid partner_id FK
    }
    MEMBERSHIPS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        membership_role role
    }
    INVITATIONS {
        uuid id PK
        uuid organization_id FK
        citext email
        membership_role role
        invitation_status status
    }
    STAFF_ORG_ASSIGNMENTS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
    }
    BRAND_PROFILES {
        uuid id PK
        uuid organization_id FK
        price_tier price_tier
        text home_country
    }
```

**Reading this cluster:** `users` is the single identity table for all three `user_type` values (`org_user`, `yorkstn_staff`, `partner`); which cluster a user can touch is determined by which join table has a row for them (`memberships` for org users, `staff_org_assignments` for staff, `partners.contact_user_id`/`users.partner_id` for partners) — see `AUTH_RBAC.md` for how this is enforced, not just modeled.

---

## 2. AI Market Intelligence cluster

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ AI_INSIGHTS : generates
    ORGANIZATIONS ||--o{ EXPANSION_READINESS_SCORES : has
    CITIES ||--o{ AI_INSIGHTS : "scoped to (optional)"
    AI_INSIGHTS ||--o{ AI_INSIGHT_SOURCES : cites
    EXPANSION_READINESS_SCORES ||--o{ READINESS_SCORE_DRIVERS : "breaks down into"
    BRAND_PROFILES ||--o{ PRODUCTS : lists

    AI_INSIGHTS {
        uuid id PK
        uuid organization_id FK
        ai_insight_category category
        uuid city_id FK
        confidence_level confidence
        jsonb structured_output
    }
    AI_INSIGHT_SOURCES {
        uuid id PK
        uuid ai_insight_id FK
        text title
        text url
    }
    EXPANSION_READINESS_SCORES {
        uuid id PK
        uuid organization_id FK
        integer score
    }
    READINESS_SCORE_DRIVERS {
        uuid id PK
        uuid readiness_score_id FK
        text driver_name
        numeric points_earned
    }
    PRODUCTS {
        uuid id PK
        uuid organization_id FK
        text hsn_code
    }
```

**Reading this cluster:** `ai_insights` is append-only and category-discriminated (one table serving six of the seven Module 1 features per `DATABASE_SCHEMA.md` §1.3's design-decision note); `expansion_readiness_scores` is deliberately a separate, structurally distinct table from `ai_insights` because it is deterministic output, never a generative one — this separation is a modeling choice that encodes a product requirement (`FEATURE_SPECIFICATIONS.md` §1.7), not an accident of normalization.

---

## 3. Compliance Operating System cluster

```mermaid
erDiagram
    ORGANIZATIONS ||--|| COMPLIANCE_CASES : has
    COMPLIANCE_CASES ||--o{ COMPLIANCE_WORKFLOW_ITEMS : contains
    COMPLIANCE_WORKFLOW_ITEMS ||--o{ DOCUMENTS : "attached via"
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : "versioned by"
    COMPLIANCE_WORKFLOW_ITEMS ||--o{ MANAGED_SERVICE_ENGAGEMENTS : "escalates to (optional)"

    COMPLIANCE_CASES {
        uuid id PK
        uuid organization_id FK
        workflow_type workflow_type
    }
    COMPLIANCE_WORKFLOW_ITEMS {
        uuid id PK
        uuid compliance_case_id FK
        workflow_item_status status
        entity_type_rec recommended_entity_type
    }
    DOCUMENTS {
        uuid id PK
        attached_to_type attached_to_type
        uuid attached_to_id
        document_type document_type
    }
    DOCUMENT_VERSIONS {
        uuid id PK
        uuid document_id FK
        integer version_number
        text file_url
    }
```

**Reading this cluster:** `documents.attached_to_id` is a polymorphic reference (no DB-level FK — see `DATABASE_SCHEMA.md` §1.4) so the same Document Management feature serves both Compliance workflow items and Partner verification uploads without duplicating the table; this is drawn as a plain relationship line here for readability, but it is **application-enforced, not database-enforced** — a detail Phase 4 implementation must not lose.

---

## 4. Partner Discovery & Retail Expansion Intelligence cluster

```mermaid
erDiagram
    PARTNERS ||--o{ PARTNER_CITIES : "serves"
    CITIES ||--o{ PARTNER_CITIES : "served by"
    PARTNERS ||--o{ PARTNER_REFERENCES : has
    PARTNERS ||--o{ PARTNER_VERIFICATIONS : "reviewed via"
    ORGANIZATIONS ||--o{ INTRODUCTION_REQUESTS : sends
    PARTNERS ||--o{ INTRODUCTION_REQUESTS : receives
    CITIES ||--o{ MALLS : contains
    ORGANIZATIONS ||--o{ SITES : evaluates
    CITIES ||--o{ SITES : "located in"
    MALLS ||--o{ SITES : "located in (optional)"
    PARTNERS ||--o{ SITES : "sourced via (optional CRE link)"
    ORGANIZATIONS ||--|| SITE_SCORING_CONFIGS : configures
    ORGANIZATIONS ||--|| EXPANSION_ROADMAPS : has
    EXPANSION_ROADMAPS ||--o{ ROADMAP_MILESTONES : contains
    ORGANIZATIONS ||--o{ FINANCIAL_PROJECTIONS : builds
    FINANCIAL_PROJECTIONS ||--o{ FINANCIAL_PROJECTION_LINE_ITEMS : contains
    ORGANIZATIONS ||--o{ LAUNCH_TASKS : tracks
    ROADMAP_MILESTONES ||--o{ LAUNCH_TASKS : "linked to (optional)"

    PARTNERS {
        uuid id PK
        partner_category category
        partner_verif_status verification_status
    }
    INTRODUCTION_REQUESTS {
        uuid id PK
        uuid organization_id FK
        uuid partner_id FK
        introduction_status status
    }
    SITES {
        uuid id PK
        uuid organization_id FK
        uuid city_id FK
        uuid mall_id FK
        numeric computed_score
    }
    EXPANSION_ROADMAPS {
        uuid id PK
        uuid organization_id FK
    }
    ROADMAP_MILESTONES {
        uuid id PK
        uuid expansion_roadmap_id FK
        milestone_type milestone_type
        milestone_status status
    }
```

**Reading this cluster:** `partners` and `cities`/`malls` are the two shared, non-tenant-scoped reference directories in the schema (per `DATABASE_SCHEMA.md`'s multi-tenancy exception list) — every other table here is `organization_id`-scoped. `roadmap_milestones.depends_on_milestone_id` (a self-referencing FK, omitted above for diagram readability) is what makes the Expansion Roadmap "dependency-aware" per `FEATURE_SPECIFICATIONS.md` §4.4.

---

## 5. Cross-cluster relationships (not re-drawn above)

- `ai_insights.requested_by_user_id` → `users.id`
- `compliance_workflow_items` ← read by → `expansion_readiness_scores.inputs_snapshot` (application-level aggregation, not an FK — the Readiness Score's compliance-completion driver is computed by querying Compliance OS state, not by a stored relationship)
- `managed_service_engagements.linked_compliance_item_id` → `compliance_workflow_items.id` (nullable — only set when requested from within a workflow, per US-50)
- `notifications.user_id` → `users.id`, fanning out from events across every other cluster (compliance deadlines, partner recommendations, engagement updates, introduction status changes, staleness alerts, invitations)
- `audit_logs.actor_user_id` → `users.id`, `audit_logs.organization_id` → `organizations.id` (nullable, for platform-level admin actions) — `audit_logs` conceptually references every mutable entity in every cluster via `(entity_type, entity_id)`, deliberately not modeled as a real FK to keep the audit table decoupled from schema evolution elsewhere.
