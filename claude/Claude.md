# Good Samaritan Ministry – Church Management System

**Comprehensive System Documentation**  
*Version 1.0 – Foundation Architecture*  
*Current Phase: 4 – Authentication Flow (in progress)*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Organisational Hierarchy – Data Model](#3-organisational-hierarchy--data-model)
4. [User & Access Management](#4-user--access-management)
5. [Authentication & Security](#5-authentication--security)
6. [Access Scope & Permission Logic](#6-access-scope--permission-logic)
7. [Application Structure (Folder Layout)](#7-application-structure-folder-layout)
8. [Dashboard Experience](#8-dashboard-experience)
9. [Operational Modules – Parish Reports](#9-operational-modules--parish-reports)
10. [Admin Portal](#10-admin-portal)
11. [Development Phases & Current Progress](#11-development-phases--current-progress)
12. [Authorization Layer – SQL Summary](#12-authorization-layer--sql-summary)
13. [Appendices](#13-appendices)

---

## 1. Introduction

This document describes the full‑system design, data model, security model, and application architecture for the **Good Samaritan Ministry (Archdiocese of Kampala)** management platform. The system is built to serve the unique hierarchical structure of the Catholic Church, where administrative authority cascades from the Archdiocese down to Vicariates, Deaneries, and Parishes.

**Core capabilities:**

- A **public ministry website** for external stakeholders and the general public.
- A **secure, role‑and‑scope‑based administrative dashboard** for church officers at every level.
- **Controlled, centralised approval** of new user accounts to prevent unauthorised access.
- **Structured data collection** (starting with monthly parish reports) that respects hierarchical boundaries.
- **Full audit trails** and system‑wide consistency enforced at the database level.

**Technology stack:**

- **Frontend & Backend:** Next.js 14+ (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- **Database, Auth & Storage:** Supabase (PostgreSQL, Row Level Security, built‑in auth)
- **Deployment:** Vercel (frontend), Supabase Cloud

---

## 2. System Architecture Overview

The platform is a **monolithic Next.js application** that uses Supabase for all backend services. There is no separate backend server – server‑side logic runs in Next.js API routes, Server Actions, and RLS policies inside the database.

The system is logically divided into three layers:

1. **Organisational Hierarchy Layer** – models the church structure.
2. **Identity & Approval Layer** – manages users, signup, verification, and role assignment.
3. **Data Access & Dashboard Layer** – enforces what each user can see and do, and renders role‑aware dashboards.

These layers are implemented across the database (schema + RLS), the Next.js app (middleware / route guards), and the UI components.

### High‑level Data Flow

1. User signs up → Supabase Auth creates an `auth.users` record → a trigger creates a `public.profiles` row.
2. User submits a registration request → a `registration_requests` row is created.
3. An Archdiocese admin reviews and approves the request → a `user_assignments` row is created, linking the user to a role and a specific scope (e.g., Vicariate Head of Rubaga Vicariate).
4. The user logs in → the app builds an `AccessContext` from the `user_assignments` table → all subsequent data queries and UI elements are filtered by that context.
5. Operational data (e.g., parish reports) is stored with **denormalized hierarchy IDs** so that RLS policies and application queries can efficiently enforce scope.

---

## 3. Organisational Hierarchy – Data Model

The church hierarchy is stored in four tables: `archdioceses`, `vicariates`, `deaneries`, `parishes`. Each lower level references **all its ancestors directly** (denormalization) to simplify queries and access control.

### Table Relationships

```
archdioceses
  └── vicariates (archdiocese_id)
        └── deaneries  (archdiocese_id, vicariate_id)
              └── parishes  (archdiocese_id, vicariate_id, deanery_id)
```

Every lower‑level table stores **all ancestor IDs**. For example, a parish row contains:
- `archdiocese_id`
- `vicariate_id`
- `deanery_id`

This design makes it trivial to filter data by any level of the hierarchy (e.g., “all parishes in a vicariate” without JOINs) and is essential for both application queries and Row Level Security.

### Key Constraints

- All tables have a `status` field (`active`, `inactive`, `archived`) so units can be soft‑deleted without breaking referential integrity.
- `code` columns are unique and human‑readable (e.g., `KLA-ARCH`, `RUB-VIC`).
- **Hierarchy validation triggers** ensure that the ancestor IDs in a child row always match the actual parent’s ancestor IDs. For instance, a parish’s `vicariate_id` must match the vicariate that its `deanery_id` belongs to. This prevents data corruption.

### Seed Data

Initially, the database must be seeded with the actual Archdiocese, Vicariates, Deaneries, and Parishes. Example:

```sql
INSERT INTO archdioceses (name, code) VALUES ('Kampala Archdiocese', 'KLA-ARCH');
```

After seeding, the hierarchy tables are mostly read‑only for regular users; only super‑admins can modify them.

---

## 4. User & Access Management

User management is split into three tightly‑coupled concepts:

1. **Identity** – the actual login (email/password) handled by Supabase Auth.
2. **Profile** – application‑specific user details and account status.
3. **Assignment** – the user’s role and scope (which part of the hierarchy they belong to).

### 4.1 Profiles (`public.profiles`)

A profile is automatically created by a database trigger whenever a new user signs up in `auth.users`.

**Key fields:**
- `id` – matches the Supabase auth user ID.
- `full_name`, `email`, `phone`, `title` – user details.
- `account_status` – `pending` by default; becomes `approved` after admin approval.
- `email_verified` – mirrored from Supabase Auth.
- `is_active` – a manual flag that can be used to quickly disable a user.

**RLS:** Users can only view and update their own profile.

### 4.2 Registration Requests (`public.registration_requests`)

When a user signs up, they indicate which role and organisational level they claim to lead. This information is stored in a `registration_requests` row – **it is not yet an active assignment**.

**Key fields:**
- `requested_role` – e.g., `vicariate_head`, `parish_data_entry`.
- `requested_level` – `archdiocese`, `vicariate`, `deanery`, or `parish`.
- **Scope IDs:** `requested_archdiocese_id`, `requested_vicariate_id`, `requested_deanery_id`, `requested_parish_id`.
- `approval_status` – `pending`, `approved`, or `rejected`.
- `reviewed_by`, `reviewed_at`, `review_notes` – admin review details.

A validation trigger ensures that only the IDs relevant to the chosen `requested_level` are filled.

**RLS:** Users can view only their own requests and insert their own requests.

### 4.3 User Assignments (`public.user_assignments`)

This table holds the **approved, active role‑and‑scope binding**. Only after an admin approves a registration request (and creates an assignment row) can the user access the internal dashboard.

**Key fields:**
- `role` and `level` (both enum types) – define the user’s authority.
- **Scope IDs** – the specific organisational unit(s) the user is tied to.
- `is_primary` – a user may have multiple assignments (e.g., holding two roles), but only one can be marked as primary for dashboard routing.
- `is_active` – if set to false, the user is immediately locked out of protected areas.

A **unique partial index** ensures that a user can have at most one primary, active assignment at any time:

```sql
CREATE UNIQUE INDEX uq_user_assignments_primary_per_user
  ON public.user_assignments(user_id)
  WHERE is_primary = true AND is_active = true;
```

**RLS:** Users can view their own assignment. Admin policies (added later) allow Archdiocese admins to manage assignments.

### 4.4 Approval Workflow (Centralised – V1)

Only `super_admin` and `archdiocese_admin` can approve/reject user registrations.

1. User fills in signup form (name, email, password, desired role, level, and selects the specific unit from dropdowns).
2. Supabase creates the auth user → trigger creates a `profiles` row with status `pending`.
3. User submits a registration request via the app (API/Server Action) → a row in `registration_requests` is inserted.
4. User verifies their email (handled by Supabase) → `profiles.email_verified` is updated by the app.
5. An Archdiocese admin visits the **Admin Registrations Dashboard**, sees all pending requests, and can:
   - **Verify** the user’s identity (possibly via a manual check).
   - **Approve** the request → creates a `user_assignments` row, sets profile status to `approved`.
   - **Reject** the request → sets request status to `rejected`, profile status to `rejected`.
   - **Reassign** – modify the role/level and scope before approving.
6. Upon approval, the user can log in and is routed to the appropriate dashboard based on their assignment.

After login, the app always checks:
- Is the session valid?
- Is the profile approved?
- Is there an active primary assignment?

If any condition fails, the user sees a **“Pending Approval”** or **“Access Denied”** screen.

---

## 5. Authentication & Security

### 5.1 Supabase Auth

- **Email/password authentication** (no social logins for V1).
- **Email verification** is enforced – unverified users cannot access the dashboard.
- Supabase manages password resets, session tokens, and secure cookies.
- The app uses `@supabase/ssr` to handle session management in Next.js Server Components and Server Actions.

### 5.2 Row Level Security (RLS) Policies

Every public table has RLS enabled. Policies are built on top of the `user_assignments` table, using helper functions (e.g., `current_user_assignment()`) that return the logged‑in user’s active primary assignment.

**Example – `parish_reports` SELECT policy:**

```sql
CREATE POLICY parish_reports_select_by_scope ON public.parish_reports
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_assignments ua
    WHERE ua.user_id = auth.uid()
      AND ua.is_primary = true AND ua.is_active = true
      AND (
        ua.role IN ('super_admin', 'archdiocese_admin')
        OR (ua.level = 'vicariate' AND ua.vicariate_id = parish_reports.vicariate_id)
        OR (ua.level = 'deanery' AND ua.deanery_id = parish_reports.deanery_id)
        OR (ua.level = 'parish' AND ua.parish_id = parish_reports.parish_id)
      )
  )
);
```

**Interpretation:**
- Super admins and archdiocese admins see everything.
- Vicariate heads see all reports under their vicariate.
- Deanery heads see reports from parishes in their deanery.
- Parish users see only their own parish’s reports.

Similar patterns apply to INSERT, UPDATE, and DELETE. The policies are the **last line of defense** – even if the frontend or API sends an invalid request, the database will reject it.

### 5.3 Application‑Level Guards (Server‑Side)

In addition to RLS, the Next.js application enforces access at multiple levels:

- **Middleware / Route Protection** – `middleware.ts` checks for a valid session and redirects unauthenticated users to `/login`. It can also read the user’s assignment and redirect to the correct dashboard.
- **Server Component & Server Action Guards** – every protected page and server action calls a helper like `requireAuth()`, which loads the current `AccessContext` and throws if the user lacks the required role or scope.
- **UI Guards** – client‑side components conditionally render links, buttons, and data based on the `AccessContext`. For example, a parish data entry user never sees links to the Vicariate dashboard.

This **defence‑in‑depth** approach ensures that no single failure can expose data.

---

## 6. Access Scope & Permission Logic

A central concept is the **Access Context** – a TypeScript object derived from the user’s active assignment:

```typescript
type AccessContext = {
  userId: string;
  role: AppRole;
  level: HierarchyLevel;
  archdioceseId?: string | null;
  vicariateId?: string | null;
  deaneryId?: string | null;
  parishId?: string | null;
  approved: boolean;
  active: boolean;
};
```

This context is built **once per request** (in Server Components or middleware) by querying `profiles` and `user_assignments`, then passed down to all components and server actions that need it.

**Permission Helper Functions** are defined in `lib/permissions/access.ts`. They accept an `AccessContext` and a target resource identifier, then return a boolean. Examples:

```typescript
canViewParish(ctx, parishId): boolean
canEditParishReport(ctx, report): boolean
canApproveRegistrations(ctx): boolean
canManageUsers(ctx): boolean
```

These helpers encapsulate complex hierarchy logic:
- `canViewParish` for a vicariate head → returns `true` if the parish’s `vicariate_id` matches the user’s `vicariateId`.
- `canEditParishReport` for a parish head → returns `true` only if the report’s `parish_id` matches the user’s `parishId` **and** the report’s status is `draft` (example business rule).

All server actions (e.g., creating a report, approving a user) first call the appropriate permission helper; if the check fails, the action throws a `ForbiddenError`.

---

## 7. Application Structure (Folder Layout)

The app follows Next.js App Router conventions with clear separation of concerns. **This folder structure is maintained exactly as described.**

```
src/
├── app/
│   ├── (public)/               # Public website pages
│   │   ├── page.tsx
│   │   ├── about/page.tsx
│   │   ├── ministries/page.tsx
│   │   └── contact/page.tsx
│   │
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── pending-approval/page.tsx
│   │   └── forgot-password/page.tsx
│   │
│   ├── (dashboard)/            # Protected dashboard, role-based routing
│   │   ├── layout.tsx          # Checks auth, loads AccessContext, renders shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Redirects user to role-specific home
│   │   │   ├── profile/page.tsx
│   │   │   ├── archdiocese/    # Archdiocese admin dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   ├── users/
│   │   │   │   ├── registrations/
│   │   │   │   ├── vicariates/
│   │   │   │   └── reports/
│   │   │   ├── vicariate/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── deaneries/
│   │   │   │   ├── parishes/
│   │   │   │   └── reports/
│   │   │   ├── deanery/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── parishes/
│   │   │   │   └── reports/
│   │   │   └── parish/
│   │   │       ├── page.tsx
│   │   │       ├── data-entry/
│   │   │       └── reports/
│   │   └── ... (other shared dashboard components)
│   │
│   └── api/                    # API routes (if needed; mostly Server Actions are used)
│       ├── auth/
│       ├── registrations/
│       └── reports/
│
├── components/                 # Reusable UI components
│   ├── auth/
│   ├── dashboard/
│   ├── forms/
│   ├── tables/
│   ├── layout/
│   └── ui/                     # shadcn/ui primitives
│
├── lib/                        # Application logic
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client (with cookie handling)
│   │   └── middleware.ts       # Supabase middleware helpers
│   ├── auth/
│   │   ├── getCurrentUser.ts
│   │   ├── requireAuth.ts
│   │   ├── requireApprovedUser.ts
│   │   └── getAccessContext.ts
│   ├── permissions/
│   │   ├── roles.ts
│   │   ├── scopes.ts
│   │   └── access.ts
│   └── db/                     # Database query helpers
│       ├── queries/
│       └── mutations/
│
├── features/                   # Domain-specific logic modules
│   ├── auth/
│   ├── users/
│   ├── hierarchy/
│   ├── registrations/
│   └── reports/
│
└── types/                      # TypeScript type definitions
    ├── auth.ts
    ├── db.ts
    ├── hierarchy.ts
    └── roles.ts
```

**Route Groups:**
- `(public)` – no authentication required.
- `(auth)` – unauthenticated users only; authenticated users are redirected to the dashboard.
- `(dashboard)` – wrapped in a layout that calls `requireAuth` and loads the `AccessContext`. Sub‑routes are role‑gated via additional guard functions.

**Authentication Middleware** (`middleware.ts` at project root) only checks for a valid Supabase session. It does **not** check approvals or assignments – those are handled inside `(dashboard)/layout.tsx`. This keeps the middleware lightweight and failure messages more specific.

---

## 8. Dashboard Experience

The dashboard is **not a single page filled with conditional logic**. After login, the system reads the user’s active assignment and **redirects them to their role‑specific home**:

- `archdiocese_admin` → `/dashboard/archdiocese`
- `vicariate_head` → `/dashboard/vicariate`
- `deanery_head` → `/dashboard/deanery`
- `parish_head` / `parish_data_entry` → `/dashboard/parish`

Each sub‑dashboard provides a tailored experience:
- **Archdiocese Admin** sees high‑level statistics, all vicariates/deaneries/parishes, pending registrations, and can drill down.
- **Vicariate Head** sees only their vicariate’s data, with quick access to deanery/parish reports.
- **Deanery Head** sees their deanery and its parishes.
- **Parish user** sees a simple interface to fill and submit the monthly parish report.

The **sidebar navigation** also adapts to the user’s role. For example, a parish data entry user will not see links to “Manage Vicariates”. This is achieved by filtering a `navigationConfig` array using the `AccessContext`.

---

## 9. Operational Modules – Parish Reports (V1)

The first operational module is **Monthly Parish Reports**. This module alone validates the entire hierarchical access model.

### Data Model

The `parish_reports` table stores denormalized hierarchy IDs (`archdiocese_id`, `vicariate_id`, `deanery_id`, `parish_id`) along with:
- A `reporting_period_id` linking to a predefined reporting period (e.g., January 2026).
- Status: `draft`, `submitted`, `returned`, `approved`.
- Counts of beneficiaries, households, cases, donations, etc.
- Text fields for summary, challenges, recommendations.
- Tracking columns: `prepared_by`, `submitted_by`, `approved_by`.

### Workflow

1. A `parish_data_entry` or `parish_head` opens the report form for their parish, for the current open reporting period.
2. They fill in the required metrics and optionally upload attachments (via Supabase Storage). Attachments are linked in the `attachments` table with the same denormalized IDs.
3. When ready, they submit the report (status changes to `submitted`).
4. The **Deanery Head** can view all submitted reports from parishes under their deanery. They can add comments (future) or mark as approved.
5. Vicariate and Archdiocese admins have read‑only aggregate views of all reports within their scope.

**RLS ensures** that:
- A parish user can only INSERT/UPDATE reports for their own parish.
- A deanery user cannot modify reports; they can only SELECT.

---

## 10. Admin Portal

The Archdiocese Admin Dashboard includes a comprehensive user management interface.

### Registration Review (`/dashboard/archdiocese/registrations`)

A table listing all `registration_requests` with `approval_status = 'pending'`.  
Each row shows the applicant’s name, email, phone, requested role, level, and the specific office they claim.

The admin can:
- **Approve:** Creates a `user_assignments` row with the exact scope (the requested IDs), sets the profile status to `approved`, and optionally sends a notification email.
- **Reject:** Sets the request status to `rejected`, optionally providing a reason.
- **Reassign:** If the admin believes the user should be assigned differently, they can modify the role/level and scope before approving.

The approval action is a server action that performs all updates inside a database transaction, guaranteeing consistency.

### Hierarchy Management

Super admins can add/edit Vicariates, Deaneries, and Parishes. The forms enforce the hierarchy through backend validation (triggers + application checks). For example, when adding a Deanery, the admin first selects the Vicariate; the system automatically sets the `archdiocese_id`.

---

## 11. Development Phases & Current Progress

The project is built incrementally according to the following phases. **Current status: Phase 4 is being implemented.**

### Phase 1 – Foundation Design ✅ *Completed*

- Finalised hierarchy model (`archdiocese → vicariates → deaneries → parishes`).
- Defined all roles (`super_admin`, `archdiocese_admin`, `vicariate_head`, `deanery_head`, `parish_head`, `parish_data_entry`).
- Designed the centralised approval flow.
- Identified the first operational data module: **Parish Reports**.

### Phase 2 – Database Schema & Seed ✅ *Completed*

- Created all hierarchy tables, `profiles`, `registration_requests`, `user_assignments`, `audit_logs`, and the `parish_reports` schema.
- Implemented all necessary triggers, validation checks, and partial unique indexes.
- Seeded the database with the actual Archdiocese, Vicariates, Deaneries, and Parishes.
- **Note:** The complete SQL for the authorization layer (functions, policies, indexes) is provided separately – see [Section 12](#12-authorization-layer--sql-summary).

### Phase 3 – Access Layer ✅ *Completed*

- Implemented `getAccessContext()` that builds the user’s current scope from `profiles` + `user_assignments`.
- Created all permission helper functions (`canViewParish`, `canEditParishReport`, `canApproveRegistrations`, etc.).
- Installed route guards and server‑side checks.
- Rolled out Row‑Level Security (RLS) policies on all sensitive tables.
- Verified that:
  - Parish user can only see parish data.
  - Deanery user sees deanery + parish data under them.
  - Vicariate user sees everything below them.
  - Archdiocese admin sees all.

### Phase 4 – Authentication Flow 🔄 *In Progress*

Currently building the complete authentication experience:

- **Email/password signup** with role and scope selection.
- **Email verification** flow.
- Automatic profile creation via trigger, followed by registration request submission.
- **Pending approval screen** for users not yet approved.
- **Admin approval screen** to review and act on pending registrations.
- **Login redirect by role** – after authentication and approval, users are sent to their respective dashboard (`/dashboard/archdiocese`, `/dashboard/vicariate`, etc.).

The recent message confirms that the team is actively working on **“Building authentication flow with email signup and role-based redirects”**.

### Phase 5 – Dashboards ⏳ *Upcoming*

- Build role‑specific dashboards in order:
  1. Archdiocese dashboard
  2. Vicariate dashboard
  3. Deanery dashboard
  4. Parish dashboard
- Implement adaptive navigation and scope‑filtered data displays.

### Phase 6 – Ministry Modules (Parish Reports & Beyond) ⏳ *Upcoming*

- Full CRUD for parish reports.
- Attachment uploads (Supabase Storage).
- Hierarchical viewing and approval workflows.
- Future modules: beneficiaries, cases, donations, events, volunteers.

### Post‑Phase 6 Roadmap (Future)

- Delegated user management (e.g., Vicariate heads approving parish users under them).
- Reporting aggregations and exports (PDF, Excel).
- Additional ministry modules as needed.

---

## 12. Authorization Layer – SQL Summary

The database contains a dedicated authorization layer implemented as a set of PostgreSQL functions, policies, indexes, and helpers. The full SQL file (602 lines) is available in the project repository. Below is a summary of its components.

### Helper Functions

| Function | Purpose |
|----------|---------|
| `app.current_profile_is_active()` | Checks if the current authenticated user has an approved, active profile. |
| `app.current_user_is_admin()` | Checks if the current user is a `super_admin` or `archdiocese_admin`. |
| `app.assert_current_user_is_admin()` | Raises an exception if the caller is not an admin (used as a guard inside other functions). |
| `app.validate_role_level_pair(role, level)` | Validates that a given role is allowed for a given hierarchy level. |

### Admin Approval Functions

| Function | Purpose |
|----------|---------|
| `app.approve_registration_request(...)` | Approves a pending registration request, creates a `user_assignments` row, activates the profile, and logs the action. Enforces that the caller is admin and that the role/level pair is valid. |
| `app.reject_registration_request(...)` | Rejects a request, deactivates the profile, and logs the action. |

### User Lifecycle Management Functions

| Function | Purpose |
|----------|---------|
| `app.reassign_user_assignment(...)` | Deactivates the current primary assignment and creates a new one with a different role/scope. |
| `app.suspend_user_account(...)` | Sets profile status to `suspended`, deactivates all active assignments, and logs the action. |
| `app.reactivate_user_account(...)` | Restores profile to `approved`, reactivates the primary assignment, and logs the action. Raises an error if no assignment exists. |

### Partial Unique Indexes

These indexes guarantee **one active head per hierarchy unit**:

- `uq_one_active_parish_head_per_parish` – on `user_assignments(parish_id)` where `role = 'parish_head' AND is_active = true`
- `uq_one_active_deanery_head_per_deanery` – on `user_assignments(deanery_id)` where `role = 'deanery_head' AND is_active = true`
- `uq_one_active_vicariate_head_per_vicariate` – on `user_assignments(vicariate_id)` where `role = 'vicariate_head' AND is_active = true`

### RLS Policies (Select examples)

Policies are created for `registration_requests`, `profiles`, `user_assignments`, and `audit_logs` to restrict read access to admins only. For write operations, the security definer functions above are used (they run with elevated privileges).

All policies follow the pattern:

```sql
CREATE POLICY ..._admin_select ON public.<table>
FOR SELECT TO authenticated
USING (app.current_user_is_admin());
```

This ensures that only authenticated admins can view sensitive tables directly; other users must go through the application’s server actions (which call the security definer functions).

---

## 13. Appendices

### A. Database Enums

| Enum | Values |
|------|--------|
| `account_status` | `pending, approved, rejected, suspended` |
| `approval_status` | `pending, approved, rejected` |
| `hierarchy_level` | `archdiocese, vicariate, deanery, parish` |
| `app_role` | `super_admin, archdiocese_admin, vicariate_head, vicariate_staff, deanery_head, deanery_staff, parish_head, parish_data_entry` |
| `record_status` | `active, inactive, archived` |
| `report_status` | `draft, submitted, returned, approved` |

### B. Database Triggers (Functional Summary)

| Trigger Name | Table | Purpose |
|--------------|-------|---------|
| `trg_archdioceses_updated_at` | `archdioceses` | Auto‑update `updated_at` |
| `trg_vicariates_updated_at` | `vicariates` | same |
| `trg_deaneries_updated_at` | `deaneries` | same |
| `trg_parishes_updated_at` | `parishes` | same |
| `trg_profiles_updated_at` | `profiles` | same |
| `trg_registration_requests_updated_at` | `registration_requests` | same |
| `trg_user_assignments_updated_at` | `user_assignments` | same |
| `trg_reporting_periods_updated_at` | `reporting_periods` | same |
| `trg_parish_reports_updated_at` | `parish_reports` | same |
| `trg_system_settings_updated_at` | `system_settings` | same |
| `trg_validate_registration_request_scope` | `registration_requests` | Ensures requested_level matches provided scope IDs |
| `trg_validate_user_assignment_scope` | `user_assignments` | Ensures level matches provided scope IDs |
| `trg_validate_deanery_hierarchy` | `deaneries` | Validates that archdiocese_id matches parent vicariate’s archdiocese |
| `trg_validate_parish_hierarchy` | `parishes` | Validates that archdiocese_id and vicariate_id match parent deanery |
| `trg_validate_parish_report_scope` | `parish_reports` | Ensures report’s hierarchy IDs match those of the target parish |
| `on_auth_user_created` | (on `auth.users`) | Auto‑creates `profiles` row after signup |

### C. Security Design Principles

- **Denormalized hierarchy IDs** in every operational table enable simple, fast RLS checks and application queries.
- **Centralised approval** reduces complexity – only top‑level admins can grant access.
- **Multiple enforcement layers** (RLS, server guards, route guards, UI guards) ensure defence‑in‑depth.
- **Profile auto‑creation** via trigger guarantees every auth user has a profile row.
- **Unique indexes** prevent a user from having multiple primary active assignments, avoiding ambiguity.
- **Validation triggers** catch data inconsistencies at the database level before they can propagate.

---

*This document reflects the complete system design and current state of development as of Phase 4 (Authentication Flow). All folder structures, roles, and access patterns described herein are authoritative for the project.*