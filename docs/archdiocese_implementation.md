# Archdiocese Module — Implementation Status

> Generated 2026-07-08 from the current `src/app/(dashboard)/dashboard/archdiocese/` tree.

---

## What the placeholder message means

When you navigate to a stub page you see:

> **"This surface is scaffolded for the executive console"**  
> *"The shared Archdiocese shell and hierarchy-aware query layer are in place, so this route can be expanded without revisiting the hierarchy architecture."*

This is displayed by `ArchdiocesePlaceholderPage` (`src/components/dashboard/archdiocese/shared/archdiocese-placeholder-page.tsx`). It means:

1. **The route exists and is wired into the sidebar navigation.** The URL resolves, auth guards fire, and the `ArchdioceseShell` (sidebar + topbar) renders correctly with the user's context.

2. **The data layer underneath it is already built.** The hierarchy-aware query functions in `src/features/archdiocese/queries.ts` can resolve any entity with its full `Archdiocese → Vicariate → Deanery → Parish` ancestry. A detail page for a deanery, parish, or vicariate just needs to call the right query — the joins and hierarchy resolution are done.

3. **But the page body is a placeholder.** It renders an `EmptyState` card with a "Back to …" button instead of actual forms, tables, or detail views. No CRUD operations, no detail data, no file upload logic.

**Why it's "not working":** These pages show the shell but no functional content. Clicking "View" on a parish list row navigates to `/dashboard/archdiocese/parishes/[parishId]` which only shows the placeholder message — no parish detail data. Similarly, "Create contribution", "Upload document", "Hierarchy settings", etc. all render the placeholder.

---

## Architecture overview

```
┌─────────────────────────────────────────────────────┐
│  ArchdioceseShell                                    │
│  ┌──────────────┐  ┌────────────────────────────────┐│
│  │              │  │  DashboardTopbar                ││
│  │ Archdiocese  │  │  (eyebrow, title, search,       ││
│  │ Sidebar      │  │   actions)                      ││
│  │              │  ├────────────────────────────────┤│
│  │ 11 nav items │  │                                ││
│  │ role-filtered│  │  {children} ← page content     ││
│  │              │  │                                ││
│  └──────────────┘  └────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Data layer:** `src/features/archdiocese/queries.ts` — 12 exported query functions, all built on top of `getHierarchyCollections()` + `buildHierarchyMaps()` from `src/lib/db/queries/hierarchy.ts`. Every query resolves the full hierarchy path for each row (e.g. a parish record carries its deanery and vicariate names).

**Types:** `src/features/archdiocese/types.ts` — 11 typed interfaces for query return values.

**Auth:** All archdiocese pages call `requireAuth({ roles: […] })` which gates on `super_admin`, `archdiocese_admin`, or `archdiocese_data_entry`.

---

## Page-by-page status

### ✅ Implemented (12 pages)

| Route | Status | What it does |
|---|---|---|
| `/dashboard/archdiocese` | Redirect | Redirects to `/dashboard/archdiocese/dashboard` |
| `/dashboard/archdiocese/dashboard` | **Full** | Executive dashboard: 10 stat cards, recent cross-system activity table, financial rollup with annual contributions |
| `/dashboard/archdiocese/vicariates` | **Full** | Vicariate registry table with deanery/parish counts per vicariate |
| `/dashboard/archdiocese/deaneries` | **Full** | Deanery list with vicariate parent, parish count, latest report date. "View" button links to the stub detail page |
| `/dashboard/archdiocese/parishes` | **Full** | Parish directory with search across name/code/deanery/vicariate. Shows report status, project, and contribution counts |
| `/dashboard/archdiocese/contributions` | **Full** | Contribution totals by vicariate + recent contributions table. "Create contribution" button links to stub |
| `/dashboard/archdiocese/projects` | **Full** | Project list with budget/raised amounts, status badges, full hierarchy path per project |
| `/dashboard/archdiocese/reports` | **Full** | Report status breakdown (submitted/approved/returned) + recent parish reports table |
| `/dashboard/archdiocese/settings` | **Full** | Settings snapshot: hierarchy depth stats, archdiocese profile card, architecture posture notes |
| `/dashboard/archdiocese/users` | **Full** | User assignments directory with role, level, scope, status per assignment |
| `/dashboard/archdiocese/users/approvals` | **Full** | Pending registration requests with `RegistrationTable` component showing full hierarchy context per request |
| `/dashboard/archdiocese/users/approvals/[requestId]` | **Full** | Individual approval review form (`RegistrationReviewForm`) — fetches the request with profile and hierarchy names, allows approve/reject |

### ❌ Scaffolded / Placeholder (18 pages)

All of these render the `ArchdiocesePlaceholderPage` with the "scaffolded for the executive console" message:

| Route | What's needed to implement |
|---|---|
| `/dashboard/archdiocese/vicariates/[vicariateId]` | Vicariate detail: stats, child deaneries table, parish rollup |
| `/dashboard/archdiocese/deaneries/[deaneryId]` | Deanery detail: stats, child parishes table, recent reports, projects |
| `/dashboard/archdiocese/parishes/[parishId]` | Parish detail: profile, reports, projects, contributions for one parish |
| `/dashboard/archdiocese/contributions/new` | Create contribution form (contributor name, type, amount, parish selector) |
| `/dashboard/archdiocese/projects/[projectId]` | Project detail: title, status, budget, raised, parish context, timeline |
| `/dashboard/archdiocese/projects/new` | Create project form (title, budget, parish assignment, status) |
| `/dashboard/archdiocese/documents` | Document list with hierarchy scope, file metadata, download links |
| `/dashboard/archdiocese/documents/upload` | Document upload form with parish/deanery/vicariate scope selector |
| `/dashboard/archdiocese/media` | Media library grid/table with thumbnails, hierarchy metadata |
| `/dashboard/archdiocese/media/upload` | Media upload form with file picker, scope selector |
| `/dashboard/archdiocese/reports/financial` | Financial report generation/export with date ranges, scope filters |
| `/dashboard/archdiocese/reports/parish-reports` | Expanded parish reports list with advanced filters |
| `/dashboard/archdiocese/reports/parish-reports/[reportId]` | Single report detail view with full data, status, ability to approve/return |
| `/dashboard/archdiocese/settings/hierarchy` | CRUD for vicariates, deaneries, parishes — hierarchy management UI |
| `/dashboard/archdiocese/settings/audit-logs` | Audit trail table with filters for user, action, timestamp |
| `/dashboard/archdiocese/settings/system` | System configuration: feature flags, defaults, integrations |
| `/dashboard/archdiocese/users/assignments` | Assignment management: create/edit/revoke user-role bindings |
| `/dashboard/archdiocese/users/assignments/[userId]` | Per-user assignment detail: role history, scope, active/inactive toggle |

---

## What's already built (the foundation)

### 1. Hierarchy-aware query layer (`src/features/archdiocese/queries.ts`)

All 12 query functions resolve the full `Archdiocese → Vicariate → Deanery → Parish` chain. The key pattern:

```ts
// Every query starts by loading the hierarchy tree once:
const { collections, maps } = await getArchdioceseHierarchy(archdioceseId);

// Then resolve names via the maps:
const vicariateName = maps.vicariatesById.get(parish.vicariate_id)?.name;
const deaneryName = maps.deaneriesById.get(parish.deanery_id)?.name;
```

This means **any new detail page can reuse these queries** — a `[vicariateId]` page just needs to call `getArchdioceseVicariateOverviews()` and filter to the matching ID, or write a single-entity variant of the existing query.

### 2. Shared shell component (`ArchdioceseShell`)

Provides sidebar, topbar, search, and auth context in one wrapper. Every page (implemented or stub) already uses it.

### 3. Reusable UI primitives

- `StatCard` — stat tiles with icon, value, helper text
- `SimpleTable` — data tables with typed columns
- `PageHeader` — title + description + action buttons
- `EmptyState` — dashed card for empty/placeholder states
- `Badge`, `Button`, `Card` — standard UI components
- `RegistrationTable` — full registration review table (used by approvals)
- `RegistrationReviewForm` — approve/reject form (used by `[requestId]`)

### 4. Type system (`src/features/archdiocese/types.ts`)

Strongly typed return types for every query — new pages can import and use them directly.

---

## What each stub needs to become functional

### Detail pages (`[vicariateId]`, `[deaneryId]`, `[parishId]`, `[projectId]`, `[reportId]`)

1. Import the existing query function for that entity type
2. Filter to the specific ID from `params`, or write a new `getXxxById()` query
3. Render stat cards for key metrics + detail tables for child entities
4. **The data is already available** — the queries return hierarchy context, so a parish detail page can show "Deanery: X • Vicariate: Y" without extra joins

### Create forms (`contributions/new`, `projects/new`)

1. Build a client form component (like `SignUpForm` or `LoginForm`)
2. Add a server action in `src/features/archdiocese/actions.ts` to insert into `parish_contributions` or `parish_projects`
3. Include a parish selector populated from `getArchdioceseParishOverviews()`

### Documents & Media (`documents`, `documents/upload`, `media`, `media/upload`)

1. Set up Supabase Storage buckets for documents and media
2. Build upload form with file picker + hierarchy scope selector
3. Build list view with file metadata, download/preview links
4. May need new database tables or Supabase Storage RLS policies

### Settings sub-pages (`hierarchy`, `audit-logs`, `system`)

1. **Hierarchy**: CRUD forms for vicariates/deaneries/parishes — likely the most complex, needs insert/update/delete actions
2. **Audit logs**: A query against an audit log table (may need the table created first) + filterable table UI
3. **System**: Configuration key-value store + form UI

### Reports sub-pages (`financial`, `parish-reports`, `parish-reports/[reportId]`)

1. **Financial**: Date-range picker, scope filter, aggregation query, export functionality
2. **Parish reports list**: Extended version of the existing reports page with more filters
3. **Report detail**: Fetch a single `parish_reports` row by ID, display all fields, allow status transitions (approve/return)

---

## Implementation priority recommendations

| Priority | Pages | Rationale |
|---|---|---|
| **P1 — Critical** | `parishes/[parishId]`, `deaneries/[deaneryId]`, `vicariates/[vicariateId]` | The list pages have "View" buttons that lead to empty stubs. These are the most-clicked dead ends. |
| **P2 — High** | `contributions/new`, `projects/new`, `projects/[projectId]` | The list pages have "Create" buttons that go nowhere. Without these, data entry is impossible. |
| **P3 — Medium** | `reports/parish-reports/[reportId]`, `reports/financial` | Report review and financial exports are core to the executive function. |
| **P4 — Lower** | `documents`, `media` (both list + upload) | Document/media management is supplementary to the core hierarchy oversight. |
| **P5 — Settings** | `settings/hierarchy`, `settings/audit-logs`, `settings/system`, `users/assignments` | Administrative functions needed before go-live but not for daily operations. |

---

## Why the architecture matters

The codebase is structured so that the **Vicariate dashboard module doesn't exist yet**, but when it's built, it can **reuse the same query layer** without refactoring. Every query resolves entities through their vicariate, deanery, and parish ancestry. The sidebar, shell, and navigation patterns are already split by hierarchy level (`archdiocese/`, `deanery/`, `parish/`, `vicariate/` exist as separate directories).

This is why the placeholder message says "without revisiting the hierarchy architecture" — the data model, query layer, and component shell are all built to accommodate the missing pieces. The stubs are scaffolding waiting for content, not architectural gaps.
