# Yorkstn — Information Architecture

Scope: the authenticated platform application (distinct from the existing public marketing site at the repo root, which is unaffected — see `DECISIONS.md` on marketing-site preservation).

## 1. Top-level structure

```
yorkstn.com                          Existing public marketing site (unchanged)
app.yorkstn.com  (or /app in MVP)    Authenticated platform
├── /login, /signup, /invite/:token  Auth flows
├── /onboarding                      Organization + brand profile setup wizard
├── /dashboard                       Expansion Dashboard (home)
├── /market-intelligence
│   ├── /overview                    Market analysis summary for the org's category
│   ├── /consumer-insights
│   ├── /competitors
│   ├── /pricing
│   ├── /demand-forecast
│   ├── /cities                      City recommendations (ranked list)
│   └── /readiness-score
├── /compliance
│   ├── /overview                    Cross-workflow timeline
│   ├── /entity-formation
│   ├── /import                      IEC / DGFT / CBIC / BIS checklist
│   ├── /gst
│   ├── /trademark-ip
│   └── /documents                   Document management (also linked contextually from each workflow)
├── /partners
│   ├── /discover                    Search/filter across all partner categories
│   ├── /categories/:category        (manufacturers, franchise, retail, mall-operators, cre,
│   │                                  logistics, warehousing, marketing-agencies, legal)
│   ├── /recommendations             AI partner recommendations
│   ├── /:partnerId                  Partner profile detail
│   └── /requests                    Sent/received introduction requests
├── /expansion
│   ├── /cities/:cityId               City intelligence detail
│   ├── /malls/:mallId                 Mall intelligence detail
│   ├── /site-selection                Site shortlist/scoring workspace
│   ├── /roadmap                       Expansion roadmap (sequenced plan)
│   ├── /financials                    Financial projections workspace
│   └── /launch-plan                   Launch planning / task view
├── /managed-services                  Request/track a managed-services engagement
├── /settings
│   ├── /organization                  Org profile, brand profile
│   ├── /members                       User/role management (RBAC)
│   ├── /billing
│   └── /audit-log
└── /admin (Yorkstn Staff only)
    ├── /organizations                 Cross-org oversight (scoped by assignment)
    ├── /partners/verification         Partner verification queue
    └── /content                       Compliance content source/citation management

/partner-portal (separate app shell for Partner-role users)
├── /profile
├── /verification
└── /introductions
```

## 2. Primary navigation (brand-side authenticated app)

Persistent left sidebar, grouped by module, matching Section 5 of the PRD:
1. Dashboard
2. Market Intelligence
3. Compliance
4. Partners
5. Expansion
6. Managed Services
7. Settings (bottom-anchored)

Top bar: organization switcher (for users belonging to multiple orgs — e.g., a managed-services advisor or a multi-brand holding company), notifications, user menu.

## 3. Role-based visibility (summary — full matrix in `AUTH_RBAC.md`)

| Area | Owner/Admin | Compliance Manager | Analyst/Editor | Viewer | Yorkstn Staff | Partner |
|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ (read-only) | ✓ (assigned orgs) | — |
| Market Intelligence | ✓ | read-only | ✓ | read-only | read-only | — |
| Compliance | ✓ | ✓ (full) | read-only | read-only | ✓ (assigned) | — |
| Partners | ✓ | read-only | ✓ | read-only | ✓ (verification) | own profile only |
| Expansion | ✓ | read-only | ✓ | read-only | read-only | — |
| Managed Services | ✓ (request) | ✓ (request) | read-only | read-only | ✓ (fulfill) | — |
| Settings/Members | ✓ | — | — | — | — | own profile |
| Admin | — | — | — | — | ✓ | — |

## 4. Core cross-cutting objects surfaced in navigation

- **Organization switcher** — a User can belong to more than one Organization (e.g., holding company with multiple brands, or a Yorkstn Staff member assigned to several client orgs).
- **Notifications** — compliance deadlines, new partner recommendations, managed-services engagement updates.
- **Global search** — cities, malls, partners, compliance workflow items.

## 5. Content depth conventions

- Every AI-generated output (market analysis, pricing intelligence, demand forecast, expansion readiness score, partner recommendation) displays **source/citation metadata and a generation timestamp** in-line, consistent with Phase 1's "no fabrication, cite or label as assumption" discipline — this is a hard product requirement, not a nice-to-have (see `docs/phase2/FEATURE_SPECIFICATIONS.md` §AI Output Standard).
- Every Compliance OS rule/checklist item displays a **"last verified" date and source link**, since Phase 1 found India's regulatory content changes frequently and several figures could not be directly re-verified from primary sources this session.
