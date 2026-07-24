# Yorkstn — UI/UX Wireframes (Text-Based)

**Phase:** 2 (Product & Architecture Design)
**Status:** Documentation-only — no visual mockups exist yet; these are structural/behavioral wireframe descriptions for Phase 4 implementation.
**Depends on:** `PRD.md`, `PERSONAS.md`, `INFORMATION_ARCHITECTURE.md`, `FEATURE_SPECIFICATIONS.md`, `USER_STORIES.md`

This document describes layout regions, content, states, responsive behavior, and accessibility requirements for the highest-priority screens in the authenticated platform (`/app`), per the routes defined in `INFORMATION_ARCHITECTURE.md`. It does not cover every route in the IA — lower-priority screens (e.g., `/settings/billing`, `/admin/*`) should follow the same conventions established here when built in Phase 4.

Conventions used below:
- `[ ]` = a region/component boundary in the ASCII layout.
- Every screen section includes: **Layout**, **Content**, **States** (loading / empty / error), **Responsive**, **Accessibility**.
- "AI Output Standard" fields (`summary`, `confidence`, `sources[]`, `assumptions[]`, `generatedAt`, `modelVersion`) per `FEATURE_SPECIFICATIONS.md` must render on every AI-generated card described below — this is repeated per-screen because it is a hard product requirement, not a style choice.

---

## 0. Persistent App Shell

Applies to every authenticated screen except `/onboarding` (which is a focused, sidebar-free flow) and `/partner-portal` (a separate, simpler shell — see §8).

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Skip to main content] (visually hidden until focused)              │
├───────────┬────────────────────────────────────────────────────────┤
│           │ [Top bar]                                              │
│ [Sidebar] │  Org switcher ▾   Global search   Notifications 🔔  User ▾ │
│           ├────────────────────────────────────────────────────────┤
│  Logo     │                                                        │
│  Dashboard│                [Main content region]                   │
│  Market   │                id="main-content"                       │
│   Intel.  │                                                        │
│  Compliance│                                                       │
│  Partners │                                                        │
│  Expansion│                                                        │
│  Managed  │                                                        │
│   Services│                                                        │
│ ─────────│                                                        │
│  Settings │                                                        │
└───────────┴────────────────────────────────────────────────────────┘
```

### Content
- **Sidebar (left, persistent):** module nav per IA §2 — Dashboard, Market Intelligence, Compliance, Partners, Expansion, Managed Services, then a divider, then Settings pinned to the bottom. Each item shows an icon + label; the active module is visually indicated (not by color alone — also a persistent left border/indicator and `aria-current="page"`). Sub-nav (e.g., Market Intelligence's Overview/Consumer Insights/Competitors/…) expands under the active top-level item as a nested list.
- **Top bar:** organization switcher (dropdown, shows org name + brand logo placeholder; only rendered with >1 option when the user belongs to multiple orgs — see IA §4), global search (cities/malls/partners/compliance items), notification bell with unread badge, user menu (profile, log out).
- **Main content region:** everything screen-specific below renders here, inside a landmark `<main id="main-content">`.

### States
- **Sidebar/top bar loading:** skeleton placeholders for org name and nav labels on first load; nav structure itself is static (no loading state needed for the nav shell itself since it doesn't depend on data).
- **Notification load error:** bell renders with no badge and a muted/disabled state rather than blocking the shell; a retry affordance appears only if the user opens the notification panel.
- **Organization switcher with zero orgs (should not normally occur post-onboarding):** redirects to `/onboarding` rather than rendering an empty dropdown.

### Responsive
- **Desktop (≥1024px):** sidebar persistent, expanded (icon + label).
- **Tablet (768–1023px):** sidebar collapses to icon-only (labels on hover/focus tooltip); top bar retains all elements.
- **Mobile (<768px):** sidebar becomes a slide-in drawer triggered by a hamburger control in the top bar; opening the drawer traps focus inside it until closed (Escape or overlay-click closes it and returns focus to the hamburger button). Global search collapses to an icon that expands to a full-width overlay input when activated.

### Accessibility
- Skip-nav link as the first focusable element on the page (`<a class="skip-nav" href="#main-content">Skip to main content</a>`), visually hidden until focused, matching the pattern already established on the marketing site (`yorkstn/app/layout.tsx`, `.skip-nav` in `globals.css`) — the platform section must not regress this.
- Landmarks: `<nav aria-label="Primary">` for the sidebar, `<header>` for the top bar, `<main id="main-content">` for content, `<nav aria-label="Breadcrumb">` where breadcrumbs are used inside a screen.
- Focus order: skip-link → sidebar nav (top to bottom) → top bar controls (org switcher → search → notifications → user menu) → main content. This order is fixed regardless of visual placement.
- All interactive elements must have a visible `:focus-visible` style consistent with the marketing site's existing `:focus-visible` rule in `globals.css` — no focus-style regression between the marketing site and the app shell.
- `prefers-reduced-motion: reduce` must disable the drawer slide-in transition, any dashboard chart entrance animations, and toast/notification slide-ins, falling back to instant show/hide — matching the existing `@media (prefers-reduced-motion: reduce)` handling already in `globals.css`.
- Organization switcher and user menu are disclosure widgets: `aria-haspopup="menu"`, `aria-expanded` state-synced, arrow-key navigation within the open menu, Escape closes and returns focus to the trigger.
- Notification badge count must not be color-only signal; include visually-hidden text ("3 unread notifications").

---

## 1. Onboarding Wizard (`/onboarding`)

Satisfies US-01, US-02, US-03.

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Yorkstn logo                          Step 2 of 4        │
│  ○━━━━●━━━━○━━━━○  (progress indicator)                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│   [Step heading]                                          │
│   [Step form fields — single column, one concern per step] │
│                                                            │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                         [Back]           [Continue →]     │
└──────────────────────────────────────────────────────────┘
```

### Content (per step, single-column, no sidebar)
1. **Organization basics:** org name, home country, company size band.
2. **Brand profile:** brand category (fashion / lifestyle / kids / beauty / home-living / specialty — per PRD §3 ICP), sub-category, price tier, one-line description.
3. **Team (optional, skippable):** invite Compliance Manager / Analyst by email + role (US-02); "Skip for now — invite later from Settings" link.
4. **Guided first-session preview:** a static preview card explaining the recommended path — "Next: Expansion Readiness Score → City Recommendations" (US-03) — with a single primary CTA "Go to Dashboard."

### States
- **Inline validation:** required-field errors appear next to the field on blur/submit attempt, not only in a summary banner; submission is blocked without a full-page reload (per Acceptance Criteria US-01).
- **Loading:** "Continue" button shows an inline spinner and disables itself during org/brand-profile creation; other fields remain visible (no full-page blocking spinner).
- **Error (creation failed):** a dismissible inline error banner above the form ("We couldn't save your organization — please try again"), form values are preserved, not cleared.
- **Invite step error (single invite fails, others succeed):** per-row error shown next to the failed invite; does not block the other successful invites or the wizard's progress.
- **Empty state:** not applicable — this is a required flow with no empty variant; a user with no organization is always routed here.

### Responsive
- Single-column layout already mobile-friendly by design; on mobile the step progress indicator collapses from a labeled stepper to a compact "Step 2 of 4" text + thin progress bar.

### Accessibility
- Each step is its own `<form>` region with a heading (`<h1>` for step title, updated per step — not left stale from the previous step) so screen reader users get an announced step change.
- Progress indicator uses `aria-current="step"` on the active step marker plus a visually-hidden "Step 2 of 4" text (already partially planned in Content above — ensure it's not purely a visual dot pattern).
- Focus moves to the new step's heading on Back/Continue navigation (not left on the now-hidden previous step's button).
- Skip-invite link is a real focusable link/button, not a low-contrast visual afterthought.

---

## 2. Dashboard — Expansion Dashboard Home (`/dashboard`)

Satisfies US-46. Default landing page for a returning user (per PRD §5.4, IA §1).

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Welcome back, {Org name}          [Guided first-session banner]*   │
├───────────────────┬────────────────────┬───────────────────────────┤
│ Readiness Score    │ Compliance          │ Partner Introductions    │
│  [gauge/number]    │  Top N open tasks   │  Sent / Viewed / Accepted│
│  driver breakdown  │  by due date        │  counts                  │
│  → Market Intel.   │  → Compliance       │  → Partners              │
├───────────────────┴────────────────────┴───────────────────────────┤
│ Expansion Roadmap Milestone Progress                                │
│  [horizontal stepper: Entity → Compliance → Partners → Sites → Launch]│
│  → Expansion Roadmap                                                 │
└────────────────────────────────────────────────────────────────────┘
* Banner shown only pre-activation (no Readiness Score + City Rec yet, US-03/US-01)
```

### Content
- **Readiness Score card:** 0–100 composite score (deterministic, per FEATURE_SPECIFICATIONS §1.7) with driver breakdown (Compliance / Market clarity / Capital readiness), each driver shown as a labeled sub-bar, not just a tooltip. Links through to `/market-intelligence/readiness-score`.
- **Compliance summary card:** top-N open tasks sorted by due date, each row shows workflow name, due date, and a staleness indicator if its "last verified" source date is beyond threshold (per Acceptance Criteria US-26/27). Links to `/compliance/overview`.
- **Partner introductions card:** counts by status (`sent` / `partner-viewed` / `accepted` / `declined`). Links to `/partners/requests`.
- **Roadmap milestone progress:** horizontal sequence (Entity Formation → Compliance clearances → Partner selection → Site selection → Launch), each stage showing a completion state (not-started / in-progress / done). Links to `/expansion/roadmap`.

### States
- **Loading:** each of the four cards renders its own skeleton independently (skeleton bar/gauge shapes) — cards do not block each other; the dashboard shell (welcome header) renders immediately.
- **Empty (new organization, pre-activation):** Readiness Score card shows a "Not yet calculated" state with a single CTA ("Start your Readiness Score"); Compliance/Partner/Roadmap cards show "No activity yet" with a CTA into their respective module rather than a blank box. The guided first-session banner (US-03) is prominent above the grid in this state: "Get started: Readiness Score → City Recommendations."
- **Partial data (e.g., Compliance has activity, Partners does not):** each card independently reflects its own state — a populated Compliance card and an empty Partners card render side-by-side without inconsistency.
- **Error (one card's data fails to load):** that single card shows an inline retry ("Couldn't load compliance summary — Retry"); other cards are unaffected.

### Responsive
- **Desktop:** 3-column card grid + full-width roadmap strip below.
- **Tablet:** 2-column card grid (third card wraps to next row).
- **Mobile:** single column, cards stack vertically in priority order (Readiness Score first, then Compliance, then Partners, then Roadmap); roadmap stepper becomes a vertical list instead of horizontal.

### Accessibility
- Dashboard cards are landmark `<section>` elements each with their own heading (`<h2>`), so screen-reader users can jump card-to-card via heading navigation.
- The Readiness Score gauge/number must have a text-equivalent (e.g., "Expansion Readiness Score: 62 out of 100") — never a graphic-only representation.
- Status/staleness indicators use icon + text label, not color alone (e.g., "⚠ Stale — last verified 210 days ago" not just an amber dot).

---

## 3. Market Intelligence — Overview (`/market-intelligence/overview`)

Satisfies US-10.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Market Intelligence  ▸  Overview        [sub-nav tabs: Overview |
│                                          Consumer Insights | Competitors |
│                                          Pricing | Demand Forecast |
│                                          Cities | Readiness Score]      │
├────────────────────────────────────────────────────────────┤
│ [AI output card: Market Analysis for "{category}"]           │
│  Summary narrative + structured market-size/trend block      │
│  Confidence: {high/medium/low/insufficient-data}              │
│  Sources: [cited list]     Assumptions: [list, if any]        │
│  Generated: {timestamp}    Model: {modelVersion}               │
└────────────────────────────────────────────────────────────┘
```

### Content
- Single primary AI Output Standard card: narrative summary + structured market-size/trend data, rendered per the AI Output Standard (`summary`, `confidence`, `sources[]`, `assumptions[]`, `generatedAt`, `modelVersion` — all visible, not hidden behind a disclosure by default for `sources`/`confidence`, though `assumptions[]` may collapse behind a "Show assumptions" toggle if long).
- Sub-nav tabs across the top for the other Market Intelligence sub-routes (Consumer Insights, Competitors, Pricing, Demand Forecast, Cities, Readiness Score) — all share this same tab bar and AI Output Standard card pattern for their primary content.

### States
- **Loading:** skeleton for the narrative block + a skeleton "sources" list; confidence badge skeleton.
- **Empty (brand profile incomplete):** replaced by a single CTA card: "Complete your brand profile to generate a market analysis" → link to `/settings/organization`.
- **Insufficient data:** the card still renders but `confidence: insufficient-data` is shown prominently (not de-emphasized) and the summary text explicitly states what's missing, per Acceptance Criteria (US-15's `insufficient-data` handling pattern applies to all AI Market Intelligence outputs, not just City Recommendations).
- **Error:** "Couldn't generate market analysis — Retry" inline, does not crash the sub-nav.

### Responsive
- Sub-nav tabs become a horizontally scrollable tab strip on mobile (`overflow-x: auto`, snapping), not a dropdown — preserves discoverability of all six sub-sections.

### Accessibility
- Sub-nav tabs use the ARIA tabs pattern (`role="tablist"`/`role="tab"`/`role="tabpanel"`, arrow-key navigation between tabs, `aria-selected`).
- Citation links (`sources[]`) open in a way that's announced to assistive tech as external (visually-hidden "opens in new tab" text where applicable) if they open in a new tab.

---

## 4. Market Intelligence — City Recommendations List (`/market-intelligence/cities`)

Satisfies US-15.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ City Recommendations                    [Adjust weighting ▾]│
├────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│ │ Mumbai      │ │ Bengaluru   │ │ Delhi NCR   │  ...grid     │
│ │ Score: 82   │ │ Score: 76   │ │ Score: 71   │              │
│ │ chips:      │ │ chips:      │ │ chips:      │              │
│ │ Demo-fit ●  │ │ Distrib. ●  │ │ RE-cost ▲   │              │
│ │ RE-cost ▲   │ │ Demo-fit ●  │ │ Competitive │              │
│ │ Distrib. ●  │ │ Competitive │  density ▲    │              │
│ │ [View detail→]│ [View detail→]│ [View detail→]│              │
│ └────────────┘ └────────────┘ └────────────┘                │
└────────────────────────────────────────────────────────────┘
```

### Content
- 3-column grid of city cards, ranked descending by composite score. Each card: city name, composite score (0–100), top 3 driver chips (e.g., "Demographic fit," "Real-estate cost," "Distribution maturity") each with a directional indicator (favorable/neutral/unfavorable), and a "View detail" link into `/expansion/cities/:cityId` (City Intelligence detail — §5).
- "Adjust weighting" control (top-right) opens a panel/drawer with sliders for each ranking criterion (competitive density, real-estate cost, distribution maturity, demographic fit) per FEATURE_SPECIFICATIONS §1.6 — re-running the ranking client-side or via a refetch, not a full page reload.
- Any criterion with insufficient underlying data for a city is marked `insufficient-data` on that city's chip rather than silently scored (per Acceptance Criteria US-15).

### States
- **Loading:** grid renders card-shaped skeletons in place (same count as expected result, or a fixed skeleton count of 6).
- **Empty (brand profile incomplete or no cities meet minimum data bar):** full-width message: "We need a bit more information to recommend cities" with CTA to complete brand profile.
- **Error:** full-width retry banner in place of the grid.
- **Partial (some criteria insufficient-data across many cities):** grid still renders; affected chips show "insufficient-data" label instead of a score, cards are not hidden.

### Responsive
- **Desktop:** 3-column grid.
- **Tablet:** 2-column grid.
- **Mobile:** single column, cards stack, weighting adjustment panel becomes a full-screen sheet instead of a side drawer.

### Accessibility
- Cards are a `<ul>`/`<li>` list semantically (a ranked list, not just a visual grid of divs), so assistive tech announces "list of 12 items."
- Score changes after adjusting weighting are announced via a polite `aria-live` region ("Rankings updated based on your new weighting") so screen-reader users aren't left with stale-sounding content.
- Driver chips use icon + text, not color alone, for directional indicators.

---

## 5. Market Intelligence / Expansion — City Intelligence Detail (`/expansion/cities/:cityId`)

Satisfies US-40 (city intelligence deep-dive; linked from both Market Intelligence's City Recommendations and Expansion's own nav per IA).

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to City Recommendations         Mumbai               │
├─────────────────────┬────────────────────────────────────────┤
│ Demographics         │ Competitive Density                    │
│  [summary block]      │ [list — from Module 1.3 data]          │
├─────────────────────┼────────────────────────────────────────┤
│ Real-Estate Cost      │ Distribution Maturity                  │
│  [benchmark range]    │ GT / MT / quick-commerce presence      │
├─────────────────────┴────────────────────────────────────────┤
│ [Related malls in this city →]      [Add to Site Selection →] │
└────────────────────────────────────────────────────────────┘
```

### Content
- 2x2 content grid: Demographics summary, Competitive density (reuses Module 1.3 Competitor Intelligence data), Real-estate cost benchmark range, Distribution-channel maturity (GT/MT/quick-commerce, per research §14) — each block independently labeled with its own data-freshness/source note where it draws on AI-generated or external data.
- Footer actions: link to related Mall Intelligence entries in this city, and "Add to Site Selection" (feeds `/expansion/site-selection`).

### States
- **Loading:** each of the 4 blocks skeletons independently (same independent-block loading pattern as the Dashboard).
- **Empty (no data yet for this city):** block-level "Not yet available for this city" message rather than omitting the block entirely (keeps layout stable/predictable).
- **Error:** block-level retry, consistent with Dashboard pattern.

### Responsive
- **Desktop:** 2x2 grid.
- **Mobile:** single column, blocks stack in the same reading order (Demographics → Competitive Density → Real-Estate Cost → Distribution Maturity).

### Accessibility
- Back link is a real link (not `onClick`-only div) with descriptive text ("Back to City Recommendations," not just "Back").
- Each block is a labeled `<section>` with its own `<h2>` for heading navigation.

---

## 6. Compliance — Overview / Cross-Workflow Timeline (`/compliance/overview`)

Satisfies US-26, US-27.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Compliance          [sub-nav: Overview | Entity Formation |  │
│                       Import | GST | Trademark/IP | Documents]│
├────────────────────────────────────────────────────────────┤
│ Filter: [Module ▾] [Status ▾] [Sort: Due date ▾]              │
├────────────────────────────────────────────────────────────┤
│ ⚠ Overdue   Entity Formation — File SPICe+   Due: Jun 12  │
│              Last verified: source, 45 days ago  [Get help→]│
│ ○ Upcoming  GST — Register in Karnataka        Due: Aug 3  │
│              Last verified: source, 12 days ago             │
│ ⚠ Stale     Import — BIS QCO check             Due: —      │
│              Last verified: source, 210 days ago ⚠ Stale    │
│ ...                                                          │
└────────────────────────────────────────────────────────────┘
```

### Content
- A single sortable/filterable list aggregating open items across Entity Formation, Import, GST, BIS, and Trademark/IP workflows (per FEATURE_SPECIFICATIONS §2.7). Each row: status icon (overdue/upcoming/done/stale), workflow name + task label, due date, "last verified" date + source link, and a contextual "Get expert help with this" action (routes into Managed Services request, per US-50).
- Filter bar: by module, by status, sort by due date/status/module (per Acceptance Criteria US-26/27).
- Staleness indicator (configurable threshold, e.g., 180 days) renders as a distinct visible state, not folded into the normal "upcoming" styling.

### States
- **Loading:** row-shaped skeletons (5–8 placeholder rows).
- **Empty (no compliance activity started):** full-width CTA: "Start your first compliance workflow" with links to Entity Formation (recommended starting point) and Import.
- **Error:** retry banner in place of the list; filters remain visible but disabled.
- **Filtered-to-empty (e.g., filter selects a module with no items):** distinct "No items match these filters" message with a "Clear filters" action — distinguished from the true zero-activity empty state above.

### Responsive
- **Desktop:** full table-like row layout (icon | task | due date | last-verified | action, in columns).
- **Mobile:** each row collapses into a stacked card (icon+status line, then task name, then due date, then last-verified, then action button full-width) — no horizontal scrolling of a cramped table.

### Accessibility
- The list is a `<table>` or ARIA grid only if genuinely tabular/sortable-by-column; otherwise an ordered list of "row" `<article>`/`<li>` elements is acceptable — either way, sort/filter changes must announce via `aria-live="polite"` ("Showing 8 of 14 items, sorted by due date").
- Status icons (overdue/upcoming/stale/done) always paired with text, never icon-only.
- "Get expert help with this" action clearly labeled per-row (not a bare icon button) so screen reader users don't hear 14 identical "help" buttons with no context — label as "Get expert help with SPICe+ filing," etc.

---

## 7. Compliance — Entity Formation Workflow Detail (`/compliance/entity-formation`)

Satisfies US-20.

### Layout — two states: pre-questionnaire vs. post-recommendation

**Pre-questionnaire:**
```
┌────────────────────────────────────────────────────────────┐
│ Entity Formation                                             │
├────────────────────────────────────────────────────────────┤
│ Guided Questionnaire                                          │
│  1. Planned operating model: ○ Retail ○ Wholesale ○ E-commerce│
│     ○ Manufacturing                                            │
│  2. FDI sensitivity: [context-dependent follow-up fields]      │
│  3. Timeline: [date/urgency picker]                            │
│                                          [Get recommendation →] │
└────────────────────────────────────────────────────────────┘
```

**Post-recommendation:**
```
┌────────────────────────────────────────────────────────────┐
│ Entity Formation — Recommended: Wholly Owned Subsidiary (WOS) │
│ Rationale: "Based on: retail operating model, >51% FDI intent,│
│  and X timeline..." [links back to questionnaire answers]      │
├────────────────────────────────────────────────────────────┤
│ Task Checklist                                                 │
│  ☐ SPICe+ filing            Due: —        [Upload doc] [Help]  │
│  ☐ FC-1 (if applicable)     Due: —        [Upload doc] [Help]  │
│  ...                                                            │
│                                          [Redo questionnaire]   │
└────────────────────────────────────────────────────────────┘
```

### Content
- Questionnaire is a deterministic rules-engine input, not a chat/AI interface — plain form controls, no AI Output Standard card here since this feature is explicitly deterministic/non-generative (per FEATURE_SPECIFICATIONS §2.1). The recommendation result does show its rationale as plain structured text referencing the specific answers that drove it (per Acceptance Criteria US-20), but it is not styled as an "AI card" since it isn't LLM output — a visually distinct "Rules-based recommendation" treatment should be used so users don't confuse it with a generative output requiring a confidence/sources treatment.
- Task checklist: each task has document upload affordance (linking to Document Management, §2.6) and a "Get expert help" managed-services entry point (US-50).
- "Redo questionnaire" is available but flagged with a confirmation ("This may change your recommended entity type and checklist") since re-running is a real decision, not a cosmetic toggle.

### States
- **Loading:** questionnaire skeleton (form-field shaped placeholders); post-submit, a brief processing state ("Calculating recommendation…") since the rules engine runs synchronously but may take a moment with dependent lookups.
- **Empty:** the pre-questionnaire view itself is the empty state — no separate empty state needed.
- **Error (submission fails):** inline banner, answers preserved, retry available.
- **Partial checklist progress:** completed items show a checked state with completion date; overdue items inherit the same overdue treatment as the cross-workflow timeline (§6) for visual consistency.

### Responsive
- Questionnaire remains single-column at all breakpoints (already narrow by design).
- Checklist table collapses to stacked cards on mobile, same pattern as §6.

### Accessibility
- Questionnaire uses fieldset/legend grouping per question (`<fieldset><legend>Planned operating model</legend>...radio group...</fieldset>`).
- Recommendation rationale references specific answers using visible text links back to the relevant questionnaire item ("because you selected Retail — change this answer"), not just a static paragraph.
- Checklist items use native checkbox semantics or `role="checkbox"` with proper `aria-checked` if custom-styled; due-date and staleness treatment matches §6 for consistency of learned patterns across the app.

---

## 8. Compliance — Document Upload

Applies as a contextual component embedded in any Compliance workflow item (Entity Formation, Import, GST, BIS, Trademark/IP), and as a full view at `/compliance/documents`.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Documents — SPICe+ filing (Entity Formation)                  │
├────────────────────────────────────────────────────────────┤
│ [Drop files here or Browse]                                    │
├────────────────────────────────────────────────────────────┤
│ v3  SPICe+_signed.pdf      Uploaded by Arjun   Jul 10  [↓][…]  │
│ v2  SPICe+_draft2.pdf      Uploaded by Arjun   Jul 3   [↓][…]  │
│ v1  SPICe+_draft1.pdf      Uploaded by Priya   Jun 28  [↓][…]  │
└────────────────────────────────────────────────────────────┘
```

### Content
- Drag-and-drop + browse upload target, version history list below (newest first), each row: version number, filename, uploader, upload date, download action, overflow menu (rename type tag: certificate/filing/POA/correspondence). Previous versions remain retrievable, never overwritten (per Acceptance Criteria US-25).

### States
- **Loading (upload in progress):** per-file progress indicator (percentage or indeterminate bar) in the drop zone; existing version list remains visible/interactive during upload (not blocked).
- **Empty (no documents yet for this item):** drop zone shown with "No documents yet — upload your first file" secondary text; no version list rendered below.
- **Error (upload fails — size/type/network):** inline error under the drop zone naming the specific file and reason ("SPICe+_v4.pdf — file exceeds 25MB limit"), other queued files continue uploading independently.
- **RBAC-denied (viewer/analyst without Compliance Manager or Owner/Admin role):** upload control is disabled/hidden per role (US-25's RBAC acceptance criteria); a read-only user still sees the version list and can download, just not upload/delete.

### Responsive
- Drop zone remains full-width at all breakpoints; version list rows collapse from a row-with-inline-actions to a stacked card with actions below on mobile.

### Accessibility
- Drop zone has a real file `<input type="file">` fallback (not drag-and-drop-only) reachable by keyboard/Tab, with a visible "Browse" button.
- Upload progress announced via `aria-live="polite"` region ("Uploading SPICe+_v4.pdf — 60%… Upload complete").
- Version rows are a semantic list; download/overflow-menu buttons have accessible names including the filename ("Download SPICe+_signed.pdf version 3"), not generic "Download."

---

## 9. Partners — Discovery Search/Filter List (`/partners/discover`)

Satisfies US-30, US-31.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Partners        [sub-nav: Discover | Recommendations | Requests]│
├──────────────┬───────────────────────────────────────────────┤
│ Filters       │ Sort: [Relevance ▾]              48 results   │
│ ☐ Manufacturer│ ┌───────────────────────────────────────────┐ │
│ ☐ Franchise   │ │ [Verified ✓] Rohan Furnishings Pvt. Ltd.    │ │
│ ☐ Retail/Dist.│ │ Manufacturer · Mumbai, Pune · MOQ: 500 units│ │
│ ☐ Mall Op.    │ │ [View profile →]                            │ │
│ ☐ CRE         │ └───────────────────────────────────────────┘ │
│ ☐ Logistics   │ ┌───────────────────────────────────────────┐ │
│ ☐ Warehousing │ │ [Unverified] ABC Textiles                   │ │
│ ☐ Marketing   │ │ Manufacturer · Delhi NCR                    │ │
│ ☐ Legal       │ │ [View profile →]                            │ │
│ City: [___]   │ └───────────────────────────────────────────┘ │
│ ☐ Verified only│  ...                                          │
└──────────────┴───────────────────────────────────────────────┘
```

### Content
- Left filter panel: 9 category checkboxes (Manufacturers, Franchise, Retail/Distributors, Mall Operators, CRE, Logistics, Warehousing, Marketing Agencies, Legal — per PRD §5.3), city filter, verification-status filter (`verified only` toggle), capacity/scale attributes where applicable (MOQ, etc.).
- Result list: partner cards with verification badge clearly distinguished (`Verified` with a checkmark treatment vs. `Unverified`/`Pending` with a visibly different, non-checkmark treatment — per Acceptance Criteria US-30/31, unverified must never be visually indistinguishable from verified), category, city/cities served, key capacity attribute, "View profile" link.

### States
- **Loading:** filter panel renders immediately (static); result list shows card skeletons.
- **Empty (no partners match filters):** "No partners match these filters" with a "Clear filters" action; distinct from a true zero-partner-in-category state, which instead reads "We don't have partners in this category yet — check back soon" (an honest empty state, not implying a search problem).
- **Error:** retry banner in place of results, filters remain interactive.

### Responsive
- **Desktop:** filter panel persistent left column + result list.
- **Tablet:** filter panel collapses into a "Filters" button opening a drawer; result list becomes full-width.
- **Mobile:** same drawer pattern as tablet; result cards stack single-column.

### Accessibility
- Filter checkboxes are grouped under a `<fieldset><legend>Category</legend>`.
- Verification badges use icon + text ("Verified" / "Unverified" / "Pending"), never color/checkmark alone.
- Result count and filter changes announced via `aria-live="polite"` ("48 results" updates announced on filter change without moving focus away from the filter control the user just interacted with).

---

## 10. Partners — Partner Profile Detail (`/partners/:partnerId`)

Satisfies US-31.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Discover        [Verified ✓]  Rohan Furnishings Pvt. Ltd. │
├─────────────────────┬────────────────────────────────────────┤
│ Overview             │ Verification                            │
│  Category, cities,    │  Status: Verified                        │
│  capacity/MOQ         │  Documents on file (internal-only,       │
│                        │  not shown here to brand-side users —   │
│                        │  only the verified/unverified status is)│
├─────────────────────┼────────────────────────────────────────┤
│ References            │ Contact                                  │
│  [reference list]     │  [Request Introduction →] (routed, no    │
│                        │  raw contact info exposed pre-introduction)│
└─────────────────────┴────────────────────────────────────────┘
```

### Content
- Header: verification badge + business name.
- Overview block: category, cities served, capacity/scale attributes.
- Verification block: status only for brand-side viewers (verification documents themselves are internal-only per FEATURE_SPECIFICATIONS §3.2 — not rendered on this brand-facing view at all).
- References block: reference list if provided.
- Contact block: "Request Introduction" CTA — no raw contact channel shown before an introduction is accepted (per Security Architecture reference in FEATURE_SPECIFICATIONS §3.2).

### States
- **Loading:** section skeletons.
- **Not found / removed profile:** distinct 404-style state ("This partner profile is no longer available") rather than a blank page.
- **Error:** section-level retry.

### Responsive
- **Desktop:** 2x2 content grid.
- **Mobile:** stacked single column, same order (Overview → Verification → References → Contact).

### Accessibility
- Verification status repeated as text near the badge icon in the header (not relying on the icon alone even at the top).
- "Request Introduction" button clearly labeled with the partner name in its accessible name if multiple such buttons could ever appear on one page (not the case here, but keep the pattern in mind for any future comparison view).

---

## 11. Partners — AI Recommendations Panel (`/partners/recommendations`)

Satisfies US-32.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Partner Recommendations                                       │
│ Based on your active expansion plan: Mumbai, Kids Apparel      │
├────────────────────────────────────────────────────────────┤
│ [AI card] Rohan Furnishings Pvt. Ltd. — Manufacturer            │
│  Rationale: "City match: Mumbai; Category match: kids apparel   │
│  manufacturing; Verification: verified"                         │
│  Confidence: high   Sources: [matching signals list]             │
│  Generated: {timestamp}                    [View profile →]      │
├────────────────────────────────────────────────────────────┤
│ [AI card] ... (ranked list, same structure)                     │
└────────────────────────────────────────────────────────────┘
```

### Content
- Ranked list of AI Output Standard cards, one per recommended partner: rationale string listing specific matching signals (city, category, verification status), confidence, "sources" (repurposed as the matching-signal list per FEATURE_SPECIFICATIONS §3.3), generation timestamp, and a link into the full Partner Profile (§10).
- A context line at the top states which expansion plan attributes (target city, category) drove the recommendations, so the user understands the match basis before reading individual cards.

### States
- **Loading:** ranked-card skeletons.
- **Empty (no active expansion plan / no target city or category set yet):** CTA: "Set your target cities and category to get partner recommendations" → links to `/expansion/roadmap` or brand profile.
- **Empty (plan exists but no partners match):** "No strong partner matches yet for Mumbai / kids apparel" with a link to browse `/partners/discover` manually instead.
- **Error:** retry banner.

### Responsive
- Single-column card list at all breakpoints (already a vertical ranked list by design).

### Accessibility
- Each recommendation card is a labeled `<article>` with a heading of the partner name, so screen-reader users can navigate recommendation-to-recommendation via headings.
- Rationale text is real text (not an image/chart), fully readable by assistive tech.

---

## 12. Expansion — Roadmap View (`/expansion/roadmap`)

Satisfies US-43.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Expansion Roadmap                                              │
├────────────────────────────────────────────────────────────┤
│  ●━━━━━━●━━━━━━○━━━━━━○━━━━━━○                                │
│  Entity   Compliance  Partners  Sites   Launch                 │
│  Formation clearances selection selection                       │
│  Done      In progress Not started Not started Not started      │
├────────────────────────────────────────────────────────────┤
│ [Selected stage detail panel — e.g., "Compliance clearances"]  │
│  Auto-populated status from Compliance OS   [Edit sequencing]  │
└────────────────────────────────────────────────────────────┘
```

### Content
- Horizontal sequenced stepper: Entity Formation → Compliance clearances → Partner selection → Site selection → Launch (per FEATURE_SPECIFICATIONS §4.4), each stage auto-populated from cross-module status, user-editable (can reorder/adjust dependencies within reason — the sequencing is a template, not hard-coded).
- Selecting a stage opens a detail panel below summarizing that stage's real status pulled from its source module (Compliance OS for "Compliance clearances," Partner Discovery for "Partner selection," etc.) with a deep link to the full module view.

### States
- **Loading:** stepper renders with all stages in a neutral/skeleton state.
- **Empty (new organization, no roadmap activity yet):** stepper still renders (it's a template, always visible) but every stage reads "Not started"; a "Get started with Entity Formation" CTA appears under the first stage.
- **Error (one stage's status fails to load):** that stage shows a "Status unavailable" state without blocking the rest of the stepper.

### Responsive
- **Desktop:** horizontal stepper.
- **Mobile:** vertical stepper (stages stack top-to-bottom in sequence order), detail panel appears below the tapped stage inline rather than as a separate panel region.

### Accessibility
- Stepper stages are a semantic ordered list (`<ol>`), each item's completion state announced as text ("Entity Formation — Done," "Compliance clearances — In progress"), not conveyed by connector-line color alone.
- Selecting a stage to view its detail panel moves focus to that panel's heading.

---

## 13. Expansion — Financial Projections Workspace (`/expansion/financials`)

Satisfies US-44.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Financial Projections — Mumbai            Horizon: [3 years ▾]│
├───────────────────────────┬──────────────────────────────────┤
│ Your Assumptions (editable)│ Platform Benchmarks (reference)   │
│  Rent: [___/month]         │  Rent benchmark: ₹X–Y/sqft (from   │
│  Staffing: [___]           │   Mall Intelligence, city Y)       │
│  COGS: [___%]              │  Duty/GST reference: [from          │
│  Marketing spend: [___]     │   Compliance OS, HSN-linked]        │
├───────────────────────────┴──────────────────────────────────┤
│ Projection Output (labeled: "A modeling tool you own — not a   │
│  guaranteed forecast")                                          │
│  [Revenue / Cost / Margin chart over selected horizon]           │
└────────────────────────────────────────────────────────────┘
```

### Content
- Two visually and structurally distinct panels side-by-side: **user-entered assumptions** (rent, staffing, COGS, marketing spend — directly editable) and **platform-provided benchmark ranges** (rent from Mall Intelligence §4.2, duty/GST from Compliance OS) shown as clearly-labeled reference data, never merged into the user's own numbers (per Acceptance Criteria US-44 — this distinction is a hard requirement, not a style preference).
- Output section: revenue/cost/margin projection over a user-selected horizon, with a persistent, non-dismissible label reiterating this is a modeling tool the user owns, not a guaranteed forecast (per PRD §5.4 non-goal on speculative financials).

### States
- **Loading:** assumption inputs render immediately (they're just form fields); benchmark panel and output chart show skeletons.
- **Empty (no assumptions entered yet):** output section shows a placeholder chart state: "Enter your assumptions to see a projection" rather than a zero-value chart that could be misread as a real projection of zero revenue.
- **Error (benchmark data fails to load):** benchmark panel shows "Benchmarks unavailable — using your assumptions only" and the output still calculates from user assumptions alone (never blocks the user's own modeling on an external data failure).

### Responsive
- **Desktop:** two-column (assumptions | benchmarks) above a full-width output chart.
- **Mobile:** single column — assumptions first, benchmarks second (collapsible/expandable to reduce scroll), output chart last, with the chart rendered in a horizontally scrollable container if data density requires it (per general responsive-chart practice — the page itself must not scroll horizontally, only the chart's own container).

### Accessibility
- Assumption inputs and benchmark values are in visually and programmatically distinct regions (`<section aria-label="Your assumptions">` / `<section aria-label="Platform benchmarks">`) so the user/assistive tech distinction required by US-44 is enforced structurally, not just visually.
- Chart has a text-equivalent data table available via a "View as table" toggle (never chart-only data).
- The "not a guaranteed forecast" disclaimer is real text adjacent to the chart, not an alt-text-only or tooltip-only disclosure.

---

## Design/Behavior Conventions Applied Across All Screens Above

1. **Independent block/card loading** — no screen uses a single full-page spinner once the shell has rendered; each data region loads and errors independently so a slow/failed API call never blocks unrelated content.
2. **Three-way empty-state distinction** — "no data yet because you haven't started" vs. "no results for your current filter" vs. "genuinely nothing exists in this category" are always worded differently, never collapsed into one generic "No data" message.
3. **AI vs. deterministic visual distinction** — any generative/AI output uses the AI Output Standard card treatment (confidence, sources, assumptions, timestamp); deterministic outputs (Readiness Score, Entity Formation recommendation, Site Selection scoring) are visually distinguished as rules-based, not styled identically to generative content, so users don't misjudge their epistemic status.
4. **Staleness/"last verified" indicators** on all Compliance content are a first-class, always-visible UI state, not a hover-only tooltip.
5. **RBAC-driven hiding is a UX convenience, never the security boundary** — every write action's disabled/hidden UI state corresponds to a server-side 403 for the same action (per Acceptance Criteria US-60/61); wireframes above should never be read as implying UI-only enforcement is sufficient.
