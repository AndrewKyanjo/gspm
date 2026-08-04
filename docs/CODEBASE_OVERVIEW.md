# CODEBASE OVERVIEW

> **Generated**: 2026-07-07 | **Current branch**: `main`

---

# Project Overview

**GSPM Portal** (Good Samaritans & Prisons Ministry Portal) is a church management web application built for the **Kampala Archdiocese** — Good Samaritans & Prisons Ministry. The platform serves as a central administrative hub that mirrors the hierarchical structure of the Catholic Church: **Archdiocese → Vicariate → Deanery → Parish**. It provides a public-facing ministry website alongside a secure, role-and-scope-based administrative dashboard for church officers at every level. Core features include centralized user registration with admin approval, structured monthly parish reporting, contribution tracking, project management, document/media management, and full audit trails — all enforced at both the application and database (Row Level Security) levels.

---

# Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js](https://nextjs.org) 16.2.9 (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **Runtime** | React 19.2.4 (with React Compiler enabled) |
| **Styling** | Tailwind CSS 4.3.0 with custom design tokens |
| **UI Primitives** | Custom `src/components/ui/` — follows shadcn/ui conventions (`class-variance-authority`, `clsx`, `tailwind-merge`) |
| **Icons** | Lucide React 1.23.0 + Material Symbols (Google Fonts, outlined) |
| **Database** | PostgreSQL (Supabase managed) |
| **Authentication** | Supabase Auth (email/password, Google OAuth planned) |
| **Storage** | Supabase Storage |
| **Backend Logic** | Next.js Server Actions + Supabase RPC functions |
| **Security** | Row Level Security (RLS), Security Definer functions, defense-in-depth guards |
| **Package Manager** | npm |
| **Deployment Target** | Vercel (frontend) + Supabase Cloud |

## Key Dependencies

```json
{
  "@supabase/ssr": "^0.12.0",
  "@supabase/supabase-js": "^2.110.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^1.23.0",
  "next": "16.2.9",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwind-merge": "^3.6.0"
}
```

**Dev dependencies**: `@tailwindcss/postcss`, `autoprefixer`, `babel-plugin-react-compiler`, `eslint` (flat config, Next.js presets), `postcss`, `tailwindcss`, `typescript`.

---

# Directory Structure

```
gspm/
├── src/                              # All application source code
│   ├── app/                          # Next.js App Router pages & API routes
│   │   ├── layout.tsx                # Root HTML shell (fonts, metadata)
│   │   ├── (public)/                 # Route group: public website (no auth)
│   │   │   ├── page.tsx              # Public landing page
│   │   │   ├── about/page.tsx
│   │   │   ├── ministries/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── access-denied/page.tsx
│   │   ├── (auth)/                   # Route group: auth pages (unauthenticated only)
│   │   │   ├── layout.tsx            # Split-panel auth layout
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── pending-approval/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/              # Route group: protected dashboard
│   │   │   ├── layout.tsx            # Auth guard → loads AccessContext, redirects on failure
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Root redirect → role-specific home
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── archdiocese/      # Archdiocese admin sub-dashboard
│   │   │   │   │   ├── page.tsx      # → redirects to /dashboard/archdiocese/dashboard
│   │   │   │   │   ├── layout.tsx    # Role gate (super_admin/archdiocese_admin only)
│   │   │   │   │   ├── dashboard/page.tsx   # 🆕 NEW (uncommitted)
│   │   │   │   │   ├── error.tsx     # 🆕 NEW (uncommitted)
│   │   │   │   │   ├── loading.tsx   # 🆕 NEW (uncommitted)
│   │   │   │   │   ├── contributions/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── new/page.tsx
│   │   │   │   │   ├── deaneries/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [deaneryId]/page.tsx
│   │   │   │   │   ├── documents/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── upload/page.tsx
│   │   │   │   │   ├── media/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── upload/page.tsx
│   │   │   │   │   ├── parishes/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [parishId]/page.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   └── [projectId]/page.tsx
│   │   │   │   │   ├── reports/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── financial/page.tsx
│   │   │   │   │   │   └── parish-reports/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── [reportId]/page.tsx
│   │   │   │   │   ├── settings/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── audit-logs/page.tsx
│   │   │   │   │   │   ├── hierarchy/page.tsx
│   │   │   │   │   │   └── system/page.tsx
│   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── approvals/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [requestId]/page.tsx
│   │   │   │   │   │   └── assignments/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── [userId]/page.tsx
│   │   │   │   │   └── vicariates/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── [vicariateId]/page.tsx
│   │   │   │   ├── vicariate/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── contributions/
│   │   │   │   │   ├── deaneries/
│   │   │   │   │   ├── documents/
│   │   │   │   │   ├── media/
│   │   │   │   │   ├── parishes/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── reports/
│   │   │   │   │   └── settings/
│   │   │   │   ├── deanery/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── error.tsx
│   │   │   │   │   ├── loading.tsx
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── contributions/
│   │   │   │   │   ├── documents/
│   │   │   │   │   ├── media/
│   │   │   │   │   ├── parishes/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── search/
│   │   │   │   │   └── settings/
│   │   │   │   └── parish/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── error.tsx
│   │   │   │       ├── loading.tsx
│   │   │   │       ├── not-found.tsx
│   │   │   │       ├── contributions/
│   │   │   │       ├── documents/
│   │   │   │       ├── media/
│   │   │   │       ├── projects/
│   │   │   │       ├── reports/
│   │   │   │       ├── search/
│   │   │   │       └── settings/
│   │   ├── auth/callback/route.ts    # OAuth callback handler
│   │   └── api/                      # API routes (auth, registrations, reports)
│   │       ├── auth/
│   │       ├── registrations/
│   │       └── reports/
│   │
│   ├── components/                   # Reusable UI components (2-level organization)
│   │   ├── auth/                     # AuthLeftPanel, LoginForm, SignUpForm
│   │   ├── dashboard/
│   │   │   ├── sidebar/             # Sidebar components & navigation config
│   │   │   ├── topbar/              # Breadcrumbs, top bar
│   │   │   ├── shared/              # Shared dashboard-shell components
│   │   │   ├── archdiocese/         # 🆕 NEW (uncommitted): Archdiocese shell, sidebar
│   │   │   │   ├── navigation/
│   │   │   │   └── shared/
│   │   │   ├── deanery/             # Deanery forms, navigation, shared components
│   │   │   │   ├── forms/
│   │   │   │   ├── navigation/
│   │   │   │   └── shared/
│   │   │   ├── parish/              # Parish forms, navigation, shared, stats, tables
│   │   │   │   ├── forms/
│   │   │   │   ├── navigation/
│   │   │   │   ├── shared/
│   │   │   │   ├── stats/
│   │   │   │   └── tables/
│   │   │   ├── RegistrationReviewForm.tsx
│   │   │   ├── RegistrationTable.tsx
│   │   │   └── stats-cards.tsx
│   │   ├── forms/
│   │   ├── layout/                  # PlaceholderPage
│   │   ├── tables/
│   │   └── ui/                      # shadcn/ui style primitives (button, badge, etc.)
│   │
│   ├── features/                    # Domain-specific logic modules (queries + actions + types)
│   │   ├── auth/                    # actions.ts — signUp, signInWithPassword
│   │   ├── registrations/           # actions.ts — approveRegistration, rejectRegistration
│   │   ├── archdiocese/             # 🆕 NEW (uncommitted): queries.ts, types.ts
│   │   ├── deanery/                 # Deanery feature module
│   │   │   ├── types.ts            # Deanery-specific types
│   │   │   ├── dashboard/queries.ts
│   │   │   ├── media/actions.ts, constants.ts, queries.ts
│   │   │   └── reports/actions.ts, queries.ts
│   │   ├── parish/                  # Parish feature module
│   │   │   ├── types.ts
│   │   │   ├── home/queries.ts
│   │   │   ├── contributions/actions.ts, queries.ts
│   │   │   ├── documents/actions.ts, constants.ts, queries.ts
│   │   │   ├── media/actions.ts, constants.ts, queries.ts
│   │   │   ├── projects/actions.ts, constants.ts, queries.ts
│   │   │   ├── reports/actions.ts, queries.ts
│   │   │   ├── search/queries.ts
│   │   │   └── settings/queries.ts
│   │   ├── contributions/
│   │   ├── documents/
│   │   ├── hierarchy/
│   │   ├── media/
│   │   ├── projects/
│   │   ├── reports/
│   │   └── users/
│   │
│   ├── lib/                         # Application infrastructure
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser supabase client
│   │   │   ├── server.ts           # Server (RSC) supabase client
│   │   │   ├── middleware.ts        # Legacy middleware helper
│   │   │   └── admin.ts            # Service-role admin client (server-only)
│   │   ├── auth/
│   │   │   ├── getAccessContext.ts  # Builds AccessContext from session + DB
│   │   │   ├── requireAuth.ts      # Guard: requires valid auth (with optional roles)
│   │   │   └── requireApprovedUser.ts # Guard: returns discriminated status
│   │   ├── permissions/
│   │   │   ├── roles.ts            # Role/level mappings, labels, DASHBOARD_HOME_BY_ROLE
│   │   │   ├── scopes.ts           # hasScope(), canWriteParishScope() — SQL mirrors
│   │   │   └── access.ts           # Permission helpers (canViewParish, canEditParishReport, etc.)
│   │   ├── db/
│   │   │   ├── queries/
│   │   │   │   ├── hierarchy.ts    # getHierarchyCollections(), buildHierarchyMaps()
│   │   │   │   └── deanery.ts
│   │   │   └── mutations/
│   │   │       └── deanery.ts
│   │   └── utils.ts                # cn() — clsx + tailwind-merge helper
│   │
│   ├── types/                       # Shared TypeScript types
│   │   ├── auth.ts                 # AppRole, HierarchyLevel, AccessContext, ForbiddenError, UnauthenticatedError
│   │   ├── hierarchy.ts            # Archdiocese, Vicariate, Deanery, Parish interfaces
│   │   ├── roles.ts                # Re-exports AppRole
│   │   ├── db.ts                   # (placeholder — minimal content)
│   │   ├── contribution.ts         # (placeholder — minimal content)
│   │   ├── media.ts                # (placeholder — minimal content)
│   │   └── project.ts              # (placeholder — minimal content)
│   │
│   └── middleware.ts               # Next.js middleware — session check + route protection
│
├── supabase/                        # Database migrations (run in Supabase SQL Editor)
│   └── migrations/
│       ├── 20260704_registration_approvals.sql   # app schema, approval/rejection RPCs, RLS
│       ├── 20260705_parish_contributions.sql     # parish_contributions table + RLS
│       ├── 20260706_allow_multiple_parish_reports_per_period.sql  # Drops unique constraint
│       ├── 20260706_parish_projects.sql          # parish_projects table + RLS
│       └── 20260707_deanery_report_reviews.sql   # report_status enum + deanery_report_review_events
│
├── public/                          # Static assets (SVGs: file.svg, globe.svg, next.svg)
├── claude/                          # Claude Code project documentation
│   ├── Claude.md                   # Full system architecture doc (602 lines, 13 sections)
│   └── prep.md                     # Supabase auth setup guide for beginners
├── html/                            # Original HTML mockups/assets
├── .agents/                         # Claude Code agent definitions
├── design.md                        # Proposed folder structure (reference doc)
├── package.json
├── tsconfig.json                    # Strict TS, path alias "@/*" → "./src/*"
├── next.config.ts                   # reactCompiler: true
├── tailwind.config.js              # Custom design tokens (colors, spacing, typography)
├── postcss.config.mjs
├── eslint.config.mjs                # Flat config: next/core-web-vitals + next/typescript
├── .env.local                       # Supabase URL, anon key, service role key, NVIDIA API key
└── .gitignore
```

---

# Architecture & Design

## System Architecture

The platform is a **monolithic Next.js application** using Supabase as the sole backend service. There is no separate backend server — server-side logic lives in:

1. **Next.js Server Actions** (`"use server"` functions in `src/features/*/actions.ts`)
2. **Supabase RPC functions** (PostgreSQL `security definer` functions)
3. **Row Level Security (RLS) policies** on every public table

## Organizational Hierarchy Model

The church structure is denormalized across all operational tables for efficient scoped queries:

```
archdioceses
  └── vicariates (archdiocese_id)
        └── deaneries  (archdiocese_id, vicariate_id)
              └── parishes  (archdiocese_id, vicariate_id, deanery_id)
```

Every child table stores **all ancestor IDs**. This makes `WHERE deanery_id = X` work without JOINs.

## Role-Based Access Control (RBAC)

**8 roles across 4 hierarchy levels:**

| Level | Roles |
|-------|-------|
| Archdiocese | `super_admin`, `archdiocese_admin` |
| Vicariate | `vicariate_head`, `vicariate_staff` |
| Deanery | `deanery_head`, `deanery_staff` |
| Parish | `parish_head`, `parish_data_entry` |

**AccessContext** — built once per request from `profiles` + `user_assignments`, passed to all components and actions:

```typescript
type AccessContext = {
  userId: string;
  role: AppRole;
  level: HierarchyLevel;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string | null;
  parishId: string | null;
  approved: boolean;
  active: boolean;
};
```

## Defense-in-Depth Security

| Layer | Implementation |
|-------|---------------|
| **Middleware** | `src/middleware.ts` — validates Supabase session cookie, redirects unauthenticated users to `/login` |
| **Route/Layout Guards** | `(dashboard)/layout.tsx` — calls `requireApprovedUser()`, checks profile status + active assignment |
| **Server Action Guards** | Every action calls permission helpers (e.g., `canEditParishReport()`) before touching data |
| **RLS Policies** | PostgreSQL policies on every table — the last line of defense |
| **UI Guards** | Client components conditionally render based on `AccessContext` |

## Data Flow

```
User Signup → Supabase Auth → DB trigger creates profiles row
    → App inserts registration_requests row
    → Admin approves → user_assignments row created, profile activated
    → User logs in → AccessContext built from assignment
    → All queries/actions scoped by context
    → RLS independently enforces same rules at DB level
```

## Key Design Patterns

1. **Feature-based organization**: Each domain (auth, deanery, parish, archdiocese) has its own directory under `src/features/` with `types.ts`, `queries.ts`, and `actions.ts` (server actions).

2. **TypeScript ↔ SQL mirroring**: Permission logic exists in both TypeScript (`src/lib/permissions/`) and PostgreSQL (`app` schema functions). The TypeScript side enables instant UI decisions without round trips; the SQL side (RLS + security definer functions) is the actual enforcement.

3. **Shell component pattern**: Each dashboard level (archdiocese, deanery, parish) uses a `*-shell.tsx` wrapper that provides sidebar + topbar layout. The sidebar navigation is a simple configuration array filtered by role.

4. **Server Actions over API routes**: Mutations use Next.js Server Actions (`"use server"`) rather than REST endpoints — they are progressively enhanced forms that work without client-side JavaScript.

5. **Admin client for privileged queries**: `src/lib/supabase/admin.ts` creates a Supabase client with the service role key (server-only, via `import "server-only"`), used for queries that need to bypass RLS (e.g., admin dashboards).

---

# Current State & What Is Being Done

## Recent Activity

### Git Log (last 15 commits)

```
9349582 Merge branch 'feat/deanery/dashboard-home'
bf91092 Merge pull request #26 from AndrewKyanjo/development
6df3f3a Merge branch 'main' into development
c098953 Merge pull request #25 from AndrewKyanjo/feat/deanery/media
a807dc0 Merge pull request #24 from AndrewKyanjo/feat/deanery/reports
7504927 Merge pull request #23 from AndrewKyanjo/feat/deanery/dashboard-home
bd73db6 Merge pull request #22 from AndrewKyanjo/feat/deanery/access-control
8abcf78 Merge pull request #21 from AndrewKyanjo/feat/deanery/data-integration
72035dd feat: add Deanery media upload form with image compression and validation
41a36a5 feat: add Deanery report review form and associated actions with database migrations
acd8fd8 feat: add BarListChart and TrendBars components for visualizing deanery data
589850d feat: implement Deanery dashboard layout with navigation, error handling, and loading states
48a8729 feat: add DeaneryLayout component with authentication and redirection logic
203d2e5 feat: add deanery types and database interaction functions for reports, documents, and projects
f128db5 Apply stashed changes from dev branch
```

### Uncommitted Changes

**Modified files (28)**: All under `src/app/(dashboard)/dashboard/archdiocese/` — every page in the Archdiocese dashboard has been modified. These span: contributions, deaneries, documents, media, parishes, projects, reports (financial + parish-reports), settings (audit-logs, hierarchy, system), users (approvals, assignments), and vicariates.

**New untracked files (7)**:
- `src/app/(dashboard)/dashboard/archdiocese/dashboard/` — New Archdiocese executive dashboard page
- `src/app/(dashboard)/dashboard/archdiocese/error.tsx` — Error boundary
- `src/app/(dashboard)/dashboard/archdiocese/layout.tsx` — Role-gated layout
- `src/app/(dashboard)/dashboard/archdiocese/loading.tsx` — Loading state
- `src/components/dashboard/archdiocese/` — New components: `archdiocese-shell.tsx`, `archdiocese-sidebar.tsx`, `archdiocese-placeholder-page.tsx`
- `src/features/archdiocese/` — New queries and types for the Archdiocese executive dashboard
- `src/lib/db/queries/hierarchy.ts` — New shared hierarchy query helpers

## Active Work

### Branches

| Branch | Status | Purpose |
|--------|--------|---------|
| `main` | **CURRENT** | Production-ready code |
| `development` | Local | Integration branch for feature work |
| `feat/deanery/access-control` | Merged | Deanery role-based access control and permission enforcement |
| `feat/deanery/dashboard-home` | Merged | Deanery home dashboard with stats, charts, and navigation |
| `feat/deanery/data-integration` | Merged | Database queries, mutations, and types for deanery entities |
| `feat/deanery/media` | Merged | Deanery media upload with image compression and validation |
| `feat/deanery/reports` | Merged | Deanery report review form, actions, and database migrations |

**Key observation**: All 5 `feat/deanery/*` branches have been merged into `main` via pull requests. The Deanery dashboard is the most developed role-specific module. The **Archdiocese dashboard is now the active work** — its files are all uncommitted on `main`, indicating it's the current area of development.

### Current Development Focus

The uncommitted changes reveal the active work is building out the **Archdiocese Executive Dashboard** — the highest-level administrative view. The new files show:

1. **Executive Dashboard Page** (`archdiocese/dashboard/page.tsx`): A stats-heavy overview with:
   - 10 stat cards (vicariates, deaneries, parishes, assignments, approvals, reports, families, beneficiaries, projects)
   - Recent cross-system activity table
   - Financial rollup with current-year contributions
   - Navigation to contributions, approvals, etc.

2. **Archdiocese Shell & Sidebar**: Navigation with 11 items covering Overview, Vicariates, Deaneries, Parishes, Contributions, Reports, Projects, Documents, Media, Users, Settings.

3. **Feature Queries** (`src/features/archdiocese/queries.ts`): ~530 lines of data-fetching functions for executive stats, recent activity, vicariate/deanery/parish overviews, user management, pending requests, reports, projects, and contributions — all scoped to the Archdiocese.

4. **Hierarchy Query Helpers** (`src/lib/db/queries/hierarchy.ts`): Shared query layer for fetching hierarchy collections with scope filtering and building lookup maps.

## Development Phases (from `claude/Claude.md`)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Foundation Design | ✅ Complete | Hierarchy model, roles, approval flow, identified Parish Reports as first module |
| Phase 2 — Database Schema & Seed | ✅ Complete | All tables, triggers, validation checks, indexes, seed data |
| Phase 3 — Access Layer | ✅ Complete | AccessContext, permission helpers, route guards, RLS policies |
| Phase 4 — Authentication Flow | 🔄 In Progress | Email/password signup, email verification, pending approval screen, admin approval UI, role-based redirects |
| Phase 5 — Dashboards | ⏳ Upcoming | Build: Archdiocese → Vicariate → Deanery → Parish role-specific dashboards |
| Phase 6 — Ministry Modules | ⏳ Upcoming | Full CRUD for parish reports, attachments, hierarchical approval workflows |
| Post-Phase 6 | Future | Delegated user management, PDF/Excel exports, additional modules |

**Note**: Despite the CLAUDE.md saying Phase 4 is "in progress", the actual code shows significant progress on Phase 5 (dashboards). The Deanery dashboard is fully built and merged. The Archdiocese dashboard is being built now. The auth flow (signup, login, approval) appears to be functional.

## Tasks & Roadmap

No `TODO.md`, `ROADMAP.md`, `BACKLOG.md`, `CHANGELOG.md`, or `CONTRIBUTING.md` files were found in the repository. There is no `.github/` directory or GitHub Issues templates.

The canonical roadmap is **Section 11 of `claude/Claude.md`** (summarized in the development phases above).

## Unfinished / Known Issues

1. **Placeholder type files**: Several type files (`contribution.ts`, `media.ts`, `project.ts`, `db.ts`) are effectively empty stubs — types are instead defined inline in feature modules (e.g., `src/features/deanery/types.ts`, `src/features/archdiocese/types.ts`).

2. **Vicariate dashboard is a shell**: The Vicariate dashboard routes exist (`/dashboard/vicariate/...`) but contain minimal implementations compared to Deanery and Parish.

3. **Archdiocese dashboard uncommitted**: All 35+ files for the Archdiocese dashboard are uncommitted — this is active work in progress.

4. **Legacy middleware file**: `src/lib/supabase/middleware.ts` exists but the root `src/middleware.ts` has its own inline implementation — possible dead code.

5. **Sidebar config file empty**: `src/components/dashboard/sidebar/sidebar.config.ts` is essentially empty.

6. **Google OAuth incomplete**: `prep.md` extensively documents Google OAuth setup, but the current auth code only implements email/password. The `AuthLeftPanel.tsx` component references Google Sign-In in comments.

7. **Delegated user management**: Phase 7 (future) notes that vicariate/deanery heads cannot yet approve users under them — only archdiocese admins can.

8. **Reporting aggregations**: PDF/Excel exports are listed as post-Phase 6 future work.

---

# Setup & Development

## Prerequisites

- Node.js (LTS)
- npm
- A Supabase project (configured with the migration SQL files)

## Installation

```bash
npm install
```

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Production Start

```bash
npm start
```

## Lint

```bash
npm run lint
```

## Database Setup

The `supabase/migrations/` directory contains SQL files that should be run in the Supabase SQL Editor **in chronological order** (files are date-prefixed):

1. `20260704_registration_approvals.sql` — Core auth: `app` schema, RPC functions, RLS policies
2. `20260705_parish_contributions.sql` — Contributions table
3. `20260706_parish_projects.sql` — Projects table
4. `20260706_allow_multiple_parish_reports_per_period.sql` — Schema constraint update
5. `20260707_deanery_report_reviews.sql` — Deanery review events

## Testing

No test framework is currently configured. There are no test files in the repository.

---

# Contribution Guide

No `CONTRIBUTING.md` file exists in the repository. The `claude/Claude.md` serves as the authoritative system design document. `claude/prep.md` is a beginner's guide to the Supabase + Next.js authentication setup.

For development conventions, refer to:
- The existing code patterns in `src/features/` (feature-based organization: `types.ts` + `queries.ts` + `actions.ts`)
- Component patterns in `src/components/dashboard/` (shell + sidebar + shared components)
- The design tokens in `tailwind.config.js` (custom colors, spacing, typography)
- `claude/Claude.md` for the full architecture specification
