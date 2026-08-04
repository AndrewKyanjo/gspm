# Branch Strategy & PR Plan

> Generated 2026-07-08 for the Archdiocese executive console implementation and public pages overhaul.

---

## Overview

The following branches decompose the current working tree into reviewable, mergeable units.
Each branch is stacked on the previous one in the order listed.  The PR descriptions below
can be used as-is when opening pull requests on GitHub.

**Current main:** `main`
**Base branch for all PRs:** `main` (each PR targets main sequentially)

---

## Branch 1: `feat/public-pages-overhaul`

### Scope
- Public landing page redesign (`(public)/page.tsx`)
- Public layout redesign (`(public)/layout.tsx`)
- Contact page implementation (`(public)/contact/page.tsx`)
- Removal of about and ministries pages
- Middleware update (`PUBLIC_PATHS` cleanup)

### Files changed
```
modified:   src/app/(public)/page.tsx           # Landing page → login/signup CTAs
modified:   src/app/(public)/layout.tsx         # AuthLeftPanel + nav bar
modified:   src/app/(public)/contact/page.tsx   # Real contact page (was PlaceholderPage)
deleted:    src/app/(public)/about/page.tsx
deleted:    src/app/(public)/ministries/page.tsx
modified:   src/middleware.ts                   # Remove /about, /ministries from PUBLIC_PATHS
new file:   archdiocese_implementation.md       # Module audit (informational)
```

### PR Description
```markdown
## Summary
Overhauls the public-facing pages to serve as a landing gateway directing users
to login or signup.  The UI now matches the auth pages (AuthLeftPanel split-screen
layout) for a consistent brand experience.

## Changes
- **Landing page** (`/`) — Branded card with "Sign In" and "Request Access" CTAs,
  info cards for Prison Ministry and Community Outreach, and a contact link.
- **Public layout** — Uses the same `AuthLeftPanel` as the auth pages, with a
  clean nav bar (Home, Contact, Sign In, Request Access).
- **Contact page** (`/contact`) — Real contact info (email, phone, office) with
  login/signup CTAs.  Was previously a "Coming Soon" placeholder.
- **Removed** — `/about` and `/ministries` pages (both were PlaceholderPage stubs).
- **Middleware** — `PUBLIC_PATHS` trimmed to `["/", "/contact"]`.

## How to test
1. Visit `/` — see the landing page with Sign In and Request Access buttons.
2. Click "Sign In" → navigates to `/login`.
3. Click "Request Access" → navigates to `/signup`.
4. Visit `/contact` — see contact details.
5. Visit `/about` or `/ministries` — 404 (as expected).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Branch 2: `feat/archdiocese-data-layer`

### Scope
- New query functions for detail views, financial reports, audit logs, assignments
- New TypeScript types for all detail entities
- Server actions for hierarchy management, report approval, project updates, assignment control

### Files changed
```
modified:   src/features/archdiocese/types.ts     # +17 types (detail views, financial, audit, assignment)
modified:   src/features/archdiocese/queries.ts   # +9 query functions
new file:   src/features/archdiocese/actions.ts   # +8 server actions
```

### PR Description
```markdown
## Summary
Adds the data-access and mutation layer for the Archdiocese executive console.
This is a pure backend change — no UI pages are modified.  All 18 stub pages
in the archdiocese module will consume these functions in follow-up PRs.

## New query functions (`queries.ts`)
| Function | Purpose |
|---|---|
| `getVicariateDetail` | Single vicariate with child deaneries + parishes |
| `getDeaneryDetail` | Single deanery with parishes, recent reports + projects |
| `getParishDetail` | Single parish with full hierarchy context, recent data |
| `getProjectDetail` | Single project with hierarchy path, budget/raised |
| `getReportDetail` | Single report with all fields, period, narrative |
| `getArchdioceseFinancialSummary` | Aggregated by vicariate, deanery, type, month |
| `getArchdioceseAuditLogs` | Cross-table activity feed (50 most recent events) |
| `getArchdioceseAssignmentDetail` | Per-user assignment with hierarchy scope |

## New server actions (`actions.ts`)
| Action | Purpose |
|---|---|
| `updateEntityStatus` | Activate/inactivate/archive hierarchy entities |
| `updateEntityName` | Rename vicariate, deanery, or parish |
| `updateReportStatus` | Approve or return parish reports |
| `updateProject` | Update project title, status, budget, description |
| `toggleAssignmentActive` | Enable/disable user assignments |
| `setPrimaryAssignment` | Mark an assignment as the user's primary |
| `updateAssignmentScope` | Change role, level, or hierarchy scope |

All actions are gated: `super_admin` and `archdiocese_admin` only.

## Types (`types.ts`)
Added 17 new interfaces: `VicariateDetail`, `DeaneryDetail`, `ParishDetail`,
`ProjectDetail`, `ReportDetail`, `ArchdioceseFinancialSummary`,
`ArchdioceseAuditLogEntry`, `ArchdioceseAssignmentDetail`, and supporting types.

## How to test
- Import any query in a server component and verify it returns typed data.
- Call actions from a client component — all mutations should succeed with admin auth.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Branch 3: `feat/archdiocese-detail-and-create-pages`

### Scope
- 6 detail pages (P1 — the most-clicked dead ends)
- 2 create forms (P2 — contributions/new, projects/new)
- 2 client form components
- 2 report action buttons (approve/return)

### Files changed
```
modified:   src/app/(dashboard)/dashboard/archdiocese/vicariates/[vicariateId]/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/deaneries/[deaneryId]/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/parishes/[parishId]/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/projects/[projectId]/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/reports/parish-reports/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/reports/parish-reports/[reportId]/page.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/reports/parish-reports/[reportId]/approve-button.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/reports/parish-reports/[reportId]/return-button.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/contributions/new/page.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/contributions/new/create-form.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/projects/new/page.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/projects/new/create-form.tsx
```

### PR Description
```markdown
## Summary
Implements the 8 highest-priority placeholder pages in the Archdiocese module.
Every "View" button and "Create" button in the sidebar now navigates to a
fully functional page instead of the scaffold placeholder.

## Detail pages (6)
| Page | What it shows |
|---|---|
| `vicariates/[vicariateId]` | Vicariate stats, child deaneries table, child parishes table |
| `deaneries/[deaneryId]` | Deanery stats, parishes, recent reports, recent projects |
| `parishes/[parishId]` | Parish stats (reports/projects/contributions), hierarchy context card, recent data tables |
| `projects/[projectId]` | Project details (status, budget, funding progress bar), hierarchy context, dates |
| `reports/parish-reports` | Filterable parish reports list with status badge filtering |
| `reports/parish-reports/[reportId]` | Full report view (summary, narrative, challenges, recommendations), approve/return buttons for admins |

## Create forms (2)
| Page | What it does |
|---|---|
| `contributions/new` | Parish selector with deanery+vicariate context, contributor name, type, amount, date, payment method |
| `projects/new` | Parish selector, title, category, status, location, description, dates, budget/raised amounts |

## Admin capabilities
- **Approve/Return reports** — `ApproveReportButton` and `ReturnReportButton` client components
  call `updateReportStatus` server action (gated to super_admin/archdiocese_admin).
- **Proxy entry** — Create contributions and projects on behalf of any parish.
  Uses the existing `bulkCreateContributions` / `bulkCreateProjects` actions.

## How to test
1. Navigate to any list page (vicariates, deaneries, parishes, projects, reports).
2. Click "View" on a row → detail page renders with data.
3. Click "Create contribution" or "Create project" → form submits and redirects.
4. Open a submitted report → click "Approve" or "Return" → status updates.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Branch 4: `feat/archdiocese-docs-media-settings`

### Scope
- 4 documents & media pages (list + upload)
- 3 settings sub-pages (hierarchy, audit-logs, system)
- 1 financial reports page
- 2 user assignment pages
- 2 API routes for file uploads
- 4 client form components for uploads

### Files changed
```
modified:   src/app/(dashboard)/dashboard/archdiocese/documents/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/documents/upload/page.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/documents/upload/upload-form.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/media/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/media/upload/page.tsx
new file:   src/app/(dashboard)/dashboard/archdiocese/media/upload/upload-form.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/settings/hierarchy/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/settings/audit-logs/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/settings/system/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/reports/financial/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/users/assignments/page.tsx
modified:   src/app/(dashboard)/dashboard/archdiocese/users/assignments/[userId]/page.tsx
new file:   src/app/api/archdiocese/documents/upload/route.ts
new file:   src/app/api/archdiocese/media/upload/route.ts
```

### PR Description
```markdown
## Summary
Completes the Archdiocese executive console by implementing the remaining
10 placeholder pages: documents, media, settings sub-pages, financial reports,
and user assignment management.  Also adds the API routes for file uploads.

## Documents (2 pages)
- **Document library** — Lists all deanery-level documents visible to the
  archdiocese, with category, deanery, vicariate context.
- **Upload** — Form with file picker (max 20 MB), vicariate→deanery cascade
  selector, category, title, description.  Uploads to Supabase Storage bucket
  `deanery-documents` and records metadata in `deanery_documents` table.

## Media (2 pages)
- **Media library** — Grid view of project cover images across parishes.
- **Upload** — Form with image picker (max 10 MB, preview), parish selector.
  Uploads to `parish-project-images` bucket.

## Settings (3 pages)
- **Hierarchy management** — Full read-only view of all vicariates, deaneries,
  and parishes with status badges and counts.  Mutation instructions included.
- **Audit logs** — Cross-table activity feed (50 most recent events) from
  registrations, reports, contributions, and projects.
- **System** — Read-only configuration overview (auth, storage, email,
  maintenance settings).

## Reports (1 page)
- **Financial** — Aggregated contribution data: by vicariate, by deanery,
  by contribution type, monthly trend, and recent contributions table.

## User assignments (2 pages)
- **Assignment list** — All user-role bindings with role labels, level labels,
  hierarchy scope, active/primary badges, and management action docs.
- **Assignment detail** — Single user's assignment with profile card,
  hierarchy scope card, and management instructions.

## API routes (2)
- `POST /api/archdiocese/documents/upload` — Multipart file upload to
  `deanery-documents` bucket + inserts metadata row.
- `POST /api/archdiocese/media/upload` — Multipart image upload to
  `parish-project-images` bucket, returns public URL.

## How to test
1. **Documents** — Upload a PDF, verify it appears in the library.
2. **Media** — Upload an image, verify it appears in the grid.
3. **Settings** — Visit hierarchy, audit-logs, system — all render with data.
4. **Financial** — Visit reports/financial — aggregated data renders.
5. **Assignments** — Visit users/assignments — list renders. Click View —
   detail page renders with profile and scope.

## ⚠️ Pre-merge requirement
The storage migration (`20260710_archdiocese_documents_and_storage.sql`)
must be applied to Supabase before the upload features work. See Branch 6.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Branch 5: `infra/storage-buckets-and-documents-table`

### Scope
- SQL migration creating `deanery_documents` and `parish_documents` tables
- SQL migration creating 5 storage buckets
- Storage RLS policies for all buckets
- Indexes

### Files changed
```
new file:   supabase/migrations/20260710_archdiocese_documents_and_storage.sql
```

### PR Description
```markdown
## Summary
Creates the database tables and Supabase Storage buckets required by the
Archdiocese executive console's document and media management features.

## Migration: `20260710_archdiocese_documents_and_storage.sql`

### New tables
| Table | Purpose |
|---|---|
| `deanery_documents` | Document metadata for deanery-level uploads (title, category, storage path, versioning, archival) |
| `parish_documents` | Document metadata for parish-level uploads (mirrors deanery_documents with parish scope) |

### Storage buckets created
| Bucket | Purpose |
|---|---|
| `deanery-documents` | Document files uploaded at deanery level |
| `parish-project-images` | Project cover images |
| `parish-documents` | Document files uploaded at parish level |
| `parish-media` | Media/images uploaded at parish level |
| `deanery-media` | Media/images uploaded at deanery level |

### RLS policies
- **deanery_documents**: SELECT for hierarchy-scoped users, INSERT for
  uploader's own scope, UPDATE for uploader or admin.
- **parish_documents**: SELECT and INSERT for hierarchy-scoped users.
- **Storage**: Authenticated users can SELECT and INSERT objects in all 5 buckets.

### Indexes
- `idx_deanery_documents_deanery` (partial, where not archived)
- `idx_deanery_documents_archdiocese` (partial, where not archived)
- `idx_deanery_documents_category`
- `idx_parish_documents_parish` (partial, where not archived)

## How to apply
```bash
npx supabase migration up
# or
npx supabase db push
```

## How to verify
```sql
-- Check tables exist
select table_name from information_schema.tables
where table_name in ('deanery_documents', 'parish_documents');

-- Check buckets exist
select name from storage.buckets
where name in ('deanery-documents', 'parish-project-images', 'parish-documents', 'parish-media', 'deanery-media');

-- Check RLS is enabled
select tablename, rowsecurity from pg_tables
where tablename in ('deanery_documents', 'parish_documents');
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Merge Order

```
main
  ↑ 1. feat/public-pages-overhaul          (public UI)
  ↑ 2. feat/archdiocese-data-layer         (queries + types + actions)
  ↑ 3. feat/archdiocese-detail-and-create-pages  (P1/P2 — detail views + forms)
  ↑ 4. feat/archdiocese-docs-media-settings      (P3/P4/P5 — everything else)
  ↑ 5. infra/storage-buckets-and-documents-table (migration — MUST merge before deploy)
```

Branches 2–4 depend on the data layer in branch 2.  Branch 4 depends on the
migration in branch 5 for upload features to work end-to-end, but the page
code in branch 4 will still render without it (tables will just be empty).

---

## Commit Convention

```
<type>(<scope>): <description>

Co-Authored-By: Claude <noreply@anthropic.com>
```

| Type | Usage |
|---|---|
| `feat` | New pages, queries, actions, forms |
| `fix` | Bug fixes, error handling improvements |
| `refactor` | Code restructuring without feature changes |
| `chore` | Middleware updates, config changes |
| `infra` | Database migrations, storage setup |

### Example commits for Branch 1
```
feat(public): redesign landing page with login/signup CTAs
feat(public): implement contact page with hierarchy details
feat(public): apply AuthLeftPanel to public layout for brand consistency
chore(public): remove about and ministries stub pages
chore(middleware): remove /about and /ministries from PUBLIC_PATHS
```
