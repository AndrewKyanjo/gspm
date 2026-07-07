# GSPM Portal — Feature Roadmap & Implementation TODO

> Drafted 2026-07-07 as a companion to `claude/Claude.md` and the auto-generated codebase overview. Written against the current state of the repo — Next.js 16.2.9 App Router, React 19.2.4, Supabase/Postgres with RLS, and the feature-based `src/features/*/{types,queries,actions}.ts` convention already established for auth, deanery, and parish.

Four initiatives, in the order they were requested:

1. **Timetable & Task Calendar** — Archdiocese creates tasks; Vicariate/Deanery/Parish see and act on the ones assigned to them, on a calendar.
2. **Mobile Responsiveness** — declutter what's shown on small screens, make data entry fast on a phone.
3. **Staff-Assisted (Proxy) Data Entry** — a trained staff member enters Reports/Contributions/Documents/Projects on behalf of parishes that can't use the system directly, in bulk-grid or single-page mode.
4. **Ministry Feed & Notifications** — login reminders (later, email), plus a "tweet"-style Archdiocese announcement channel with replies.

**How to read this:** each section has a _Problem Statement_, the _Design Decisions_ behind the approach (including trade-offs — a couple of these genuinely have more than one reasonable way to build them), a file-by-file _Implementation Checklist_, and _Open Questions_ worth an actual decision before or during the build. Schema and code snippets are sketches to align on shape and naming, not final migrations — re-verify column/table names against whatever's actually landed by the time each phase starts, especially since the Archdiocese dashboard is still moving underneath this.

---

## Before You Start

- [ ] **Land the in-flight Archdiocese dashboard work first.** ~35 files under `src/app/(dashboard)/dashboard/archdiocese/` and `src/components/dashboard/archdiocese/` are currently uncommitted on `main`. Every feature below touches that directory — Tasks live there, Proxy Entry is heaviest there. Merging that work first avoids stacking four more feature branches on an already-large diff.
- [ ] **Pick one convention for the placeholder type files.** `src/types/contribution.ts`, `media.ts`, `project.ts`, and `db.ts` are currently near-empty stubs, with the real types living inline in each feature's `types.ts`. Several items below add new types — worth deciding once, project-wide, whether inline-per-feature is the permanent convention or whether these stub files should start being filled in.
- [ ] **Resolve whether `src/lib/supabase/middleware.ts` is dead code** (the root `src/middleware.ts` reportedly has its own inline implementation) before anything new — like notification counts — gets bolted onto the wrong one.
- [ ] **Note that the Vicariate dashboard is currently a shell** relative to Deanery/Parish. The Vicariate-level Tasks and Feed pages proposed below will be some of the first real functionality in that dashboard — worth deciding whether to build them in isolation or fold them into a broader pass at fleshing out Vicariate generally.

---

## At a Glance

| #   | Feature                           | New DB tables                 | New role?                       | Primarily lives in                                            |
| --- | --------------------------------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------- |
| 1   | Timetable & Task Calendar         | `tasks`, `task_assignments`   | No                              | Archdiocese (create) + all 4 levels (view / update)           |
| 2   | Mobile Responsiveness             | —                             | No                              | Every dashboard shell, table, and form                        |
| 3   | Staff-Assisted (Proxy) Data Entry | none — column additions only  | Maybe: `archdiocese_data_entry` | Archdiocese heaviest, extends to Vicariate/Deanery            |
| 4   | Ministry Feed & Notifications     | `feed_posts`, `notifications` | No                              | New shared `dashboard/feed` + `dashboard/notifications` pages |

Recommended build order and reasoning: Section 6.

---

## 1. Timetable & Task Calendar System

### 1.1 Problem Statement

The Archdiocese needs to create tasks/deadlines ("Submit Q3 financial summary," "Deanery heads meeting," "Youth ministry training registration closes") that automatically become visible to whichever Vicariates, Deaneries, or Parishes they concern, shown on a calendar rather than buried in a list.

### 1.2 Design Decisions

**Separate the task definition from each recipient's assignment.** A `tasks` row is the thing itself — title, description, due date, priority. A `task_assignments` row is one concrete recipient (a specific parish, deanery, or vicariate) plus that recipient's own completion status. This is deliberate over storing the target scope directly on the task row, because a task assigned to "all 40 parishes in Rubaga Vicariate" needs 40 independent done/not-done states — the Archdiocese needs to see _which_ parishes are behind, not just an aggregate. It also mirrors the existing `registration_requests` → `user_assignments` two-step pattern already used elsewhere in this codebase.

**Assignments are expanded to concrete rows at creation time**, not stored as a wildcard pattern. When an admin targets "all parishes in Vicariate X," the create action resolves that to N literal `task_assignments` rows at insert time (one per currently-active parish), rather than storing `vicariate_id = X, parish_id = NULL` and interpreting "NULL means all" at query time. This costs more rows up front but makes RLS trivial — `parish_id = ctx.parishId`, exactly like every other RLS policy in this codebase — and gives clean per-parish audit history even if a parish is added to the vicariate later.

**Creation stays Archdiocese-only for v1**, matching what was asked. The permission check should still be a named helper (`canCreateTask`) rather than an inline role comparison, so that Vicariate/Deanery-scoped task creation — a natural Phase 2 ask, and consistent with the "delegated user management" item already on this project's own roadmap — is a one-line change later rather than a rewrite.

### 1.3 Data Model

New migration: `supabase/migrations/20260708_tasks_and_calendar.sql`

```sql
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status   AS ENUM ('not_started', 'in_progress', 'completed', 'overdue', 'cancelled');

CREATE TABLE public.tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  description          text,
  category             text,                 -- 'report_deadline' | 'meeting' | 'training' | 'general' ...
  priority             public.task_priority NOT NULL DEFAULT 'medium',
  due_date             date NOT NULL,
  due_time             time,                 -- nullable; set for meetings, null for all-day deadlines
  reporting_period_id  uuid REFERENCES public.reporting_periods(id), -- optional link to an existing reporting period
  archdiocese_id       uuid NOT NULL REFERENCES public.archdioceses(id),
  created_by           uuid NOT NULL REFERENCES public.profiles(id),
  status               public.record_status NOT NULL DEFAULT 'active', -- is the TASK DEFINITION itself live/archived (reuses the existing enum) — not the same thing as completion, see below
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.task_assignments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id            uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  target_level       public.hierarchy_level NOT NULL,   -- 'vicariate' | 'deanery' | 'parish' in practice
  archdiocese_id     uuid NOT NULL REFERENCES public.archdioceses(id),
  vicariate_id       uuid REFERENCES public.vicariates(id),
  deanery_id         uuid REFERENCES public.deaneries(id),
  parish_id          uuid REFERENCES public.parishes(id),
  assignment_status  public.task_status NOT NULL DEFAULT 'not_started', -- THIS recipient's completion progress
  completed_by       uuid REFERENCES public.profiles(id),
  completed_at       timestamptz,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_task_target UNIQUE (task_id, target_level, vicariate_id, deanery_id, parish_id)
);

CREATE INDEX idx_tasks_due_date            ON public.tasks(due_date);
CREATE INDEX idx_task_assignments_parish    ON public.task_assignments(parish_id)    WHERE parish_id IS NOT NULL;
CREATE INDEX idx_task_assignments_deanery   ON public.task_assignments(deanery_id)   WHERE deanery_id IS NOT NULL;
CREATE INDEX idx_task_assignments_vicariate ON public.task_assignments(vicariate_id) WHERE vicariate_id IS NOT NULL;
```

- [ ] Add `trg_tasks_updated_at`, `trg_task_assignments_updated_at` (matching the existing `updated_at` trigger convention applied to every other table).
- [ ] Add `trg_validate_task_assignment_scope` — mirrors `trg_validate_registration_request_scope`: only the scope column(s) relevant to `target_level` may be non-null.
- [ ] RLS on `tasks`: `SELECT` for admins, or for any user with a `task_assignments` row pointing at their scope (join). `INSERT` / `UPDATE` / `DELETE` restricted to `app.current_user_is_admin()`.
- [ ] RLS on `task_assignments`: `SELECT` and `UPDATE (assignment_status, notes, completed_by, completed_at)` where the caller's active assignment scope matches the row's scope, or the caller is admin. No direct client `INSERT` — only through the RPC below.
- [ ] Security-definer RPC `app.create_task_with_assignments(p_title, p_description, p_category, p_priority, p_due_date, p_due_time, p_target_level, p_target_ids uuid[])` — validates the caller is admin, inserts the `tasks` row, resolves `p_target_ids` (or a `NULL`/empty-array sentinel meaning "all active units at that level") into concrete `task_assignments` rows in the same transaction, and writes an `audit_logs` entry, matching the style of `app.approve_registration_request`.

### 1.4 Permission Helpers (`src/lib/permissions/access.ts`)

- [ ] `canCreateTask(ctx): boolean` — `role in ('super_admin', 'archdiocese_admin')` for v1.
- [ ] `canUpdateTaskAssignment(ctx, assignment): boolean` — true if the assignment's scope matches `ctx`'s own scope (the recipient marking their own progress), or `ctx` is admin.

### 1.5 Calendar UI

Two view modes, fed by the same query so there's one source of truth:

- **Table/Grid view** — a sortable, filterable data table (Title, Category, Assigned To, Due Date, Priority, Status). Best for an admin managing many tasks at once. This is the "grid format" from the brief.
- **Calendar Tile view** — a traditional month grid, each day a tile, tasks rendered as small colored pills inside the day's tile (colored by priority or category); clicking a day expands the full list. This is the "normal calendar with tiles."

- [ ] Add `date-fns` as a new dependency (lightweight, tree-shakeable) for month-grid date math. There's no calendar library in the current dependency list, and hand-rolled `Date` arithmetic for a month grid (leap years, week-start-day, etc.) is a common source of off-by-one bugs.
- [ ] Build `CalendarShell` (Server Component — fetches the month's tasks) → `CalendarGrid` (Client Component — view toggle, day click, hover), following the same server-fetches / client-interacts split already used elsewhere in this codebase.

### 1.6 File / Folder Changes

```
supabase/migrations/20260708_tasks_and_calendar.sql

src/features/tasks/
  types.ts     — Task, TaskAssignment, TaskWithAssignments, TaskStatus, TaskPriority, CreateTaskInput
  queries.ts   — getTasksForScope(ctx), getTaskById(id), getTaskCalendarMonth(ctx, year, month), getUpcomingTasksForScope(ctx, days)
  actions.ts   — createTask(input), updateTask(id, input), deleteTask(id), updateAssignmentStatus(assignmentId, status, notes)

src/components/dashboard/shared/calendar/
  CalendarGrid.tsx
  CalendarTile.tsx
  TaskTableView.tsx
  TaskCard.tsx
  TaskStatusBadge.tsx
  ViewToggle.tsx

src/app/(dashboard)/dashboard/archdiocese/tasks/
  page.tsx            — calendar/table view + "New Task" button
  new/page.tsx         — task creation form (title, description, due date/time, priority, target level + scope picker reusing getHierarchyCollections())
  [taskId]/page.tsx    — task detail + per-recipient status list

src/app/(dashboard)/dashboard/vicariate/tasks/page.tsx   — read-only calendar scoped to the vicariate + "mark my status" on own assignment rows
src/app/(dashboard)/dashboard/deanery/tasks/page.tsx     — same, scoped to deanery
src/app/(dashboard)/dashboard/parish/tasks/page.tsx      — same, scoped to parish
```

- [ ] Add a "Timetable" nav item (`calendar_month` Material Symbol) to `archdiocese-sidebar.tsx` and the read-only equivalent to vicariate/deanery/parish sidebar configs.
- [ ] Add an "Upcoming Tasks" widget to each level's home dashboard. The Archdiocese executive dashboard already aggregates ten stat cards in `src/features/archdiocese/queries.ts` — add a task count / next-due-date alongside them rather than building a parallel stats system.

### 1.7 Cross-Feature Integration

Tasks approaching or past their `due_date` should be a primary source of the reminders in Section 4 (Ministry Feed & Notifications). Build the `task_due_soon` / `task_overdue` notification fan-out directly against `task_assignments`.

### 1.8 Open Questions

- [ ] Recurring tasks ("due on the 5th of every month")? Not in the original brief — recommend punting to Phase 2 and modeling v1 tasks as one-off with a specific `due_date`. A recurring task can be simulated for now by creating one task per period.
- [ ] Should Vicariate/Deanery heads eventually create tasks scoped to their own sub-tree? The permission helper above is written to make this a small change later.

---

## 2. Mobile Responsiveness & Simplified Data Entry

### 2.1 Problem Statement

Two related asks: figuring out what's actually essential to show on a small screen so dashboards don't feel cluttered, and making it fast to _enter_ data on a phone, since that's where a lot of parish-level users will be.

### 2.2 Design Decisions

**Treat this as a reusable pattern library, not a one-time pass.** Extract 3–4 responsive primitives once, then apply them to both existing pages and to the new Task / Proxy-Entry / Feed UI as it's built. Retrofitting responsive design after the fact is always more expensive than designing with it from day one.

**Prefer CSS-only responsive switching over JS media-query state.** Render both the mobile and desktop navigation in the DOM and toggle visibility with Tailwind's `md:hidden` / `hidden md:flex`, rather than a `useMediaQuery` hook that conditionally renders one or the other. Next.js renders on the server without knowing the viewport size, so JS-based conditional rendering risks a flash of the wrong nav on load; pure CSS toggling doesn't have that problem.

### 2.3 Information Hierarchy Audit

- [ ] For each dashboard home page — the Archdiocese executive dashboard's 10 stat cards, Deanery's stats, Parish's stats — rank cards by importance and define a mobile cut-line. Example: Archdiocese shows its top 4 (Pending Approvals, Reports Due, Active Projects, This Month's Contributions) on mobile with a "View all stats" expander, instead of all 10 competing for space at 375px wide.
- [ ] Do the same for the "recent activity" tables on each dashboard home — mobile shows fewer rows with a "View all" link instead of the full table.

### 2.4 Responsive Navigation

- [ ] Add a bottom tab bar (4–5 icons: Home, Reports, Contributions, Tasks, Profile/More) for one-thumb navigation on mobile, visible only below `md:`.
- [ ] Keep the existing sidebar for `md:` and above; if there's a gap at tablet-portrait widths, convert it to a slide-out drawer (hamburger trigger in the topbar) rather than leaving it squeezed.
- [ ] New components: `src/components/dashboard/shared/MobileBottomNav.tsx`, `src/components/dashboard/shared/MobileDrawer.tsx`. Wire into each `*-shell.tsx` (archdiocese, vicariate, deanery, parish) alongside the existing sidebar.

### 2.5 Responsive Data Tables

- [ ] Build one reusable `<ResponsiveTable>` (in `src/components/ui/` or `src/components/tables/`) that renders as a normal `<table>` at `md:` and above, and as a stacked list of label:value cards below it. Use it for contributions, reports, projects, users, and audit-log tables across all four levels instead of one-off table markup per page.

### 2.6 Responsive Forms

- [ ] Long forms — the Parish monthly report especially, with beneficiaries, households, cases, donations, narrative fields, and attachments — become a multi-step wizard on mobile (Basic Info → Metrics → Attachments → Review & Submit) instead of one long scroll; can stay single-page at `md:` and above. Extract a shared `FormWizard` / `FormStep` primitive in `src/components/forms/` rather than rebuilding this per form.
- [ ] Use correct mobile input types everywhere data entry happens: `type="date"`, `type="number"` / `inputMode="numeric"` for counts and currency, `type="tel"` for phone fields. This alone meaningfully speeds up mobile entry and directly supports Section 3 below.
- [ ] Minimum 44×44px tap targets on all buttons/icons in mobile layouts.
- [ ] Consider a "Quick Add" floating action button on the Parish mobile dashboard for the single most common action (e.g. quick contribution entry).

### 2.7 Testing Checklist

No test framework currently exists in this repo. At minimum, manually verify each dashboard page at 360px (small phone), 768px (tablet), and 1024px+ (desktop) as part of PR review for every feature in this document. Playwright for responsive visual-regression snapshots is a reasonable future investment but is out of scope to bundle into this wave of work.

---

## 3. Staff-Assisted (Proxy) Data Entry

### 3.1 Problem Statement

Many parishes have no one who can use the portal directly — information currently arrives by WhatsApp or Facebook message to a person, and a trained staff member (today, realistically, someone at the Archdiocese) needs to type that information into the system _as if_ they were that parish, for Reports, Contributions, Documents, and Projects. Two entry shapes are needed: a fast spreadsheet-style bulk grid, and a guided single-record full-page form.

**Explicitly out of scope:** automatically ingesting messages from WhatsApp or Facebook. That would require WhatsApp Business API approval, message parsing, and a lot of infrastructure that's a genuinely separate project. What's in scope here is making the _manual re-typing_ step as fast and error-proof as possible.

### 3.2 Design Decisions — the permission gap this exposes

This is the trickiest part of the four features, so it's worth being explicit about why. Today, write access to `parish_reports` is explicitly scoped to the owning parish only — per the existing docs, "a parish user can only INSERT/UPDATE reports for their own parish; a deanery user cannot modify reports, they can only SELECT" — and the same self-scoped pattern almost certainly applies to `parish_contributions` and `parish_projects`, given how consistently this codebase scopes every other write path. Read access, by contrast, is already extended hierarchically (Deanery/Vicariate/Archdiocese can _see_ everything below them). Proxy entry needs a genuinely new capability: letting an ancestor-scope role write _on behalf of_ a descendant scope, while keeping the audit trail honest about who actually typed it in.

**Three new columns solve the audit problem, not a new table.** Add to `parish_reports`, `parish_contributions`, `parish_projects`, and wherever file uploads are tracked (the docs reference a `documents` feature, a `media` feature, and a report-specific `attachments` table separately — confirm the exact table name(s) against the live schema before writing the migration):

- `entry_method` (`self_reported` | `proxy_entered`)
- `entered_by` (profile id of whoever actually typed it — may differ from `prepared_by` / `submitted_by`, which represents the parish personnel the data is _about_)
- `source_channel` (`whatsapp` | `facebook` | `phone_call` | `email` | `in_person` | `system` — `system` is the default for ordinary self-entry)

`entry_method` and `entered_by` should be **stamped by a trigger**, not trusted from client input — compare the inserting user's own scope to the record's target scope; if they differ, force `entry_method = 'proxy_entered'` and set `entered_by = auth.uid()`. That way a user can't misrepresent which mode was used.

```sql
-- Sketch — exact table/column names to confirm against the live schema at build time
CREATE OR REPLACE FUNCTION app.stamp_proxy_entry()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parish_id IS NOT DISTINCT FROM (SELECT ua.parish_id FROM public.user_assignments ua
       WHERE ua.user_id = auth.uid() AND ua.is_primary AND ua.is_active) THEN
    NEW.entry_method := 'self_reported';
  ELSE
    NEW.entry_method := 'proxy_entered';
    NEW.entered_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
```

**Should there be a new role?** The current `app_role` enum has a head+staff pair at every level _except_ Archdiocese (`vicariate_head`/`vicariate_staff`, `deanery_head`/`deanery_staff`, `parish_head`/`parish_data_entry` — but only `archdiocese_admin` at the top). If the "trained professional" doing proxy entry shouldn't also get admin powers like approving registrations or editing system settings, that's a real gap worth closing.

- [ ] **Recommended:** add `archdiocese_data_entry` to the `app_role` enum, scoped to only the proxy-entry capabilities in this section. Needs: an `ALTER TYPE ... ADD VALUE` migration, an update to the role/level tables and labels in `src/lib/permissions/roles.ts`, new branches in the permission helper below, and a sidebar config that hides user-management / settings / hierarchy nav items for this role.

### 3.3 Permission Helper

New helper in `src/lib/permissions/access.ts` (or alongside the existing SQL-mirroring helpers in `scopes.ts`):

```typescript
function canProxyEnterForScope(
    ctx: AccessContext,
    target: {
        vicariateId?: string | null;
        deaneryId?: string | null;
        parishId?: string | null;
    },
): boolean {
    if (
        ["super_admin", "archdiocese_admin", "archdiocese_data_entry"].includes(
            ctx.role,
        )
    )
        return true;
    if (ctx.level === "vicariate" && ctx.vicariateId === target.vicariateId)
        return true;
    if (ctx.level === "deanery" && ctx.deaneryId === target.deaneryId)
        return true;
    return false;
}
```

Mirror this exact logic as a new RLS `OR` branch on the relevant tables' `INSERT` policies (and, cautiously, `UPDATE` if proxy edits after the fact are wanted) — same shape as the existing `parish_reports_select_by_scope` policy, just applied to `INSERT` instead of `SELECT`, and one level narrower (vicariate/deanery _containing_ the target, not just matching it).

### 3.4 Single-Entry Mode

This reuses the _existing_ report/contribution/project creation forms — it should not need a parallel form system.

- [ ] Audit the existing `archdiocese/contributions/new/page.tsx`, `archdiocese/documents/upload/page.tsx`, and `archdiocese/projects/new/page.tsx` pages first: do they already accept a target parish, or do they currently only create Archdiocese-scoped records? This determines whether the work below is "add a field" or "add a field and change what scope the action writes against."
- [ ] Add a scope-selector (cascading Vicariate → Deanery → Parish, searchable) to the top of each form, reusing `getHierarchyCollections()` / `buildHierarchyMaps()` from `src/lib/db/queries/hierarchy.ts` — this was built for the Archdiocese executive dashboard's overview pages and is exactly the lookup data this selector needs.
- [ ] Add the `source_channel` dropdown next to it.
- [ ] Parameterize the underlying form components (`src/components/dashboard/parish/forms/*`) to accept an optional `targetParishId` prop that defaults to `ctx.parishId` for ordinary self-entry, and is overridden by the scope-selector's value in the proxy-entry context — one form implementation, not two.

### 3.5 Bulk-Entry Mode

Bulk entry doesn't fit every module the same way — worth designing per-module rather than one generic grid:

| Module        | Bulk shape                                                                                        | Fit                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributions | Rows vary by _parish_ (Parish, Category, Amount, Date, Notes, Source Channel)                     | **Best fit** — a whole month's contributions from several parishes in one sitting                                                                                                                                    |
| Projects      | Similar shape (Name, Parish, Budget, Target Beneficiaries, Start/End Date, Status)                | Good fit                                                                                                                                                                                                             |
| Documents     | One _shared_ scope, _many files_ — the opposite shape from Contributions                          | Different bulk pattern: pick one target scope, drag-and-drop multiple files, then a lightweight per-file metadata row (filename auto-filled, Category, Title)                                                        |
| Reports       | Too many long narrative fields (challenges, recommendations, summary) to usefully cram into cells | **Poor fit** — single-entry only for full reports in v1; a bulk mode limited to just the numeric core fields is a reasonable stretch goal, but call it out as a deliberately reduced version, not a full bulk report |

- [ ] Build a custom, lightweight `<BulkEntryGrid>` (a React state array of row objects + native inputs per cell) rather than adopting a spreadsheet library up front — sufficient for realistic batch sizes (tens of parishes, not thousands). Note `@tanstack/react-table` as an upgrade path if row counts grow large enough to need virtualization.
- [ ] Support Tab / Shift+Tab and Enter for cell-to-cell movement, a "duplicate last row" shortcut, and — moderate complexity, high value — paste-from-clipboard: parsing a pasted block of tab/newline-delimited text into grid rows, since staff may first jot numbers from a WhatsApp message into their own scratch spreadsheet before bulk-pasting here.
- [ ] Client-side per-cell validation before submit (required fields, non-negative amounts); a single Server Action (`bulkCreateContributions(records[])`, `bulkCreateProjects(records[])`) re-validates server-side and inserts all rows in **one transaction**. Recommend all-or-nothing for v1 — a clear per-row error list on failure, no silently-partial submissions — over partial-success commits, which get confusing to reconcile.

### 3.6 File / Folder Changes

```
supabase/migrations/20260709_proxy_entry_columns.sql   — entry_method, entered_by, source_channel columns + stamping trigger + updated INSERT RLS

src/lib/permissions/access.ts   — canProxyEnterForScope()
src/lib/permissions/roles.ts    — (if adding the new role) role/level mapping + label updates

src/features/contributions/actions.ts   — bulkCreateContributions(records[])
src/features/projects/actions.ts        — bulkCreateProjects(records[])
src/features/documents/actions.ts       — bulkUploadDocuments(scopeId, files[], metadata[])

src/components/dashboard/shared/bulk-entry/
  BulkEntryGrid.tsx
  ScopeSelector.tsx        — cascading Vicariate → Deanery → Parish picker, built on getHierarchyCollections()
  SourceChannelSelect.tsx

src/app/(dashboard)/dashboard/archdiocese/contributions/new/page.tsx   — extend: scope selector + source channel
src/app/(dashboard)/dashboard/archdiocese/contributions/bulk/page.tsx  — new: grid entry
src/app/(dashboard)/dashboard/archdiocese/projects/bulk/page.tsx       — new
src/app/(dashboard)/dashboard/archdiocese/documents/upload/page.tsx    — extend: bulk multi-file + metadata table
```

### 3.7 Audit / Accountability Display

- [ ] Report / contribution / document / project detail views show a small badge whenever `entry_method = 'proxy_entered'`: "Entered by {staff name} on behalf of {parish name}, via {source_channel}, on {date}." Keeps the provenance visible to, say, a Deanery Head reviewing a report — consistent with this codebase's existing emphasis on full audit trails.

---

## 4. Ministry Feed & Notifications

### 4.1 Problem Statement

Two related pieces: system-generated reminders that surface on login (overdue reports, contributions, task due-dates), later also pushed by email; and a lightweight "tweet-like" broadcast channel where the Archdiocese posts announcements and users below can reply, visually distinguished by color — root posts on a light-green background, replies on light-blue.

### 4.2 Data Model

New migration: `supabase/migrations/20260710_feed_and_notifications.sql`

```sql
CREATE TABLE public.feed_posts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_post_id      uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE, -- null = root announcement, set = reply
  author_id           uuid NOT NULL REFERENCES public.profiles(id),
  content             text NOT NULL,
  archdiocese_id      uuid NOT NULL REFERENCES public.archdioceses(id),
  is_pinned           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz  -- soft delete for moderation
);

CREATE TYPE public.notification_type AS ENUM (
  'task_assigned', 'task_due_soon', 'task_overdue',
  'report_period_open', 'report_overdue',
  'feed_post_new', 'feed_reply_new'
);

CREATE TABLE public.notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id          uuid NOT NULL REFERENCES public.profiles(id),
  type                  public.notification_type NOT NULL,
  title                 text NOT NULL,
  body                  text,
  link_url              text,
  related_task_id       uuid REFERENCES public.tasks(id),
  related_feed_post_id  uuid REFERENCES public.feed_posts(id),
  read_at               timestamptz,
  emailed_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Root-post visibility for v1: broadcast to everyone in the archdiocese** (no per-post targeting UI yet — matches what was actually asked for: "the archdiocese to send out a piece of information"). The schema has room to add `target_level` / `target_*_id` columns later without a breaking change, so don't build the targeting UI now, but don't paint the schema into a corner either.
- [ ] Replies inherit the root post's visibility — enforce with a trigger that copies `archdiocese_id` (and, if targeting is added later, the target scope) from the root post onto every reply at insert time, so RLS can check a reply's own columns directly instead of recursively looking up its parent. This follows the same "denormalize ancestor identifiers so RLS stays simple" convention already used everywhere else in this schema.
- [ ] Replies are flat — reply-to-post only, not reply-to-reply — keeping the UI a simple two-tier list instead of a nested comment tree, matching the "tweet-like" brief.
- [ ] RLS: `SELECT` on `feed_posts` for any authenticated approved user (broadcast model). `INSERT` of a root post (`parent_post_id IS NULL`) restricted to `app.current_user_is_admin()`. `INSERT` of a reply open to any authenticated approved user. `UPDATE` / soft-delete restricted to the author or an admin.
- [ ] RLS: `SELECT` / `UPDATE (read_at)` on `notifications` restricted to `recipient_id = auth.uid()`. No client-side `INSERT` — rows are only created by triggers / security-definer functions (the task-assignment trigger from Section 1, a `feed_posts` insert trigger, and a reporting-period check).
- [ ] **Fan-out decision to make explicitly:** materializing one `notifications` row per recipient per broadcast post is simple and reuses one system for both the bell icon and the future email digest, but does mean N rows per post for N users. The lighter-weight alternative — compute "unread posts" as "posts created after your last feed visit timestamp" without ever writing a row — avoids the fan-out write but doesn't give a natural hook for the email digest later. Recommend the materialized-row approach; Postgres handles the resulting row counts (tens of thousands per year even for a large archdiocese) without difficulty, and it keeps one mental model for every notification type.

### 4.3 Feed UI — the "tweet-like" design

Extend `tailwind.config.js` with semantic tokens consistent with the existing Material-Design-3-style token system already in use (`primary`, `on-surface`, `outline-variant`, `error-container`, etc.), rather than one-off hex values in component code:

```js
colors: {
  // ...existing tokens
  'feed-post': '#E8F5E9',
  'feed-post-border': '#A5D6A7',
  'feed-reply': '#E3F2FD',
  'feed-reply-border': '#90CAF9',
}
```

```
FeedPostCard.tsx   → className="bg-feed-post border border-feed-post-border rounded-xl p-4"
FeedReplyCard.tsx  → className="bg-feed-reply border border-feed-reply-border rounded-lg p-3 ml-8"   (indented under its parent)
```

- [ ] Each post/reply is its own `<div>` per the brief — post container green, reply container blue.
- [ ] Author display reuses the role labels already defined in `src/lib/permissions/roles.ts` as a small colored role-pill next to the author's name (Archdiocese / Vicariate / Deanery / Parish), so at a glance it's clear who's talking without reading the whole hierarchy.

### 4.4 Notification Bell & Shared Pages

- [ ] `NotificationBell.tsx` in `src/components/dashboard/topbar/` — unread badge count, dropdown of recent notifications, "mark all read."
- [ ] `src/app/(dashboard)/dashboard/notifications/page.tsx` and `src/app/(dashboard)/dashboard/feed/page.tsx` as **role-agnostic shared pages** directly under `dashboard/` — the same way `dashboard/profile/page.tsx` is shared today — rather than duplicating the feed/notifications view four times under `archdiocese/`, `vicariate/`, `deanery/`, `parish/`. The composer ("New Announcement") renders only when `canPostAnnouncement(ctx)` is true; everything else in the page is identical for every role.

### 4.5 Email Digest (Phase 2, as requested — "later to be implemented")

- [ ] Add `email_notifications_enabled boolean default true` to `profiles` so users can opt out.
- [ ] Reuse **Resend** — already the recommended provider for the auth verification/reset emails in this project's own setup docs — but call its transactional API directly (not just SMTP) for a templated digest.
- [ ] Scheduling: since the app deploys on Vercel + Supabase, use a **Vercel Cron Job** hitting a Next.js Route Handler (`src/app/api/cron/send-notification-digest/route.ts`) on a daily schedule — no new infra beyond what's already in the deployment stack. (Supabase `pg_cron` or a scheduled Edge Function is a reasonable alternative if scheduling should live inside Supabase instead.) The job queries `notifications WHERE emailed_at IS NULL AND recipient wants email`, groups by recipient, sends one digest each, stamps `emailed_at`.
- [ ] New env var: `RESEND_API_KEY` (server-only, no `NEXT_PUBLIC_` prefix).

### 4.6 File / Folder Changes

```
supabase/migrations/20260710_feed_and_notifications.sql
tailwind.config.js   — feed-post / feed-reply color tokens

src/features/feed/
  types.ts, queries.ts (getFeedPosts, getRepliesForPost), actions.ts (createAnnouncement, createReply, deletePost)

src/features/notifications/
  types.ts, queries.ts (getMyNotifications, getUnreadCount), actions.ts (markAsRead, markAllAsRead)

src/components/dashboard/feed/
  FeedPostCard.tsx, FeedReplyCard.tsx, FeedComposer.tsx, ReplyComposer.tsx, AuthorBadge.tsx

src/components/dashboard/shared/notifications/
  NotificationBell.tsx, NotificationDropdown.tsx, NotificationItem.tsx

src/app/(dashboard)/dashboard/feed/page.tsx
src/app/(dashboard)/dashboard/notifications/page.tsx
src/app/api/cron/send-notification-digest/route.ts   (Phase 2)
```

---

## 5. Cross-Cutting Engineering Notes

### 5.1 New Dependencies

| Package                                     | Why                                                   | Used by            |
| ------------------------------------------- | ----------------------------------------------------- | ------------------ |
| `date-fns`                                  | Month-grid date math without hand-rolled arithmetic   | Timetable (§1)     |
| `resend` (npm SDK)                          | Transactional email digest                            | Feed (§4, Phase 2) |
| `@tanstack/react-table` _(optional, later)_ | Only if bulk-entry row counts outgrow the custom grid | Proxy Entry (§3)   |

### 5.2 New Migrations (suggested order)

1. `20260708_tasks_and_calendar.sql`
2. `20260709_proxy_entry_columns.sql`
3. `20260710_feed_and_notifications.sql`

Dates are illustrative — bump to the next available date at merge time, following the existing date-prefixed convention.

### 5.3 Testing

No test framework exists in the repo today. The permission helpers this roadmap adds — `canCreateTask`, and especially `canProxyEnterForScope` — are pure functions gating who can write data on whose behalf, which is genuinely security-sensitive and cheap to unit test. Recommend introducing **Vitest** for exactly these functions as part of this wave of work rather than as a separate initiative — getting a hierarchy-scope check wrong is exactly the kind of bug that's invisible in manual testing and obvious in a unit test.

---

## 6. Recommended Phasing

The brief listed these four in the order Timetable → Mobile → Staff Entry → Feed. Suggested build order, and why it differs slightly:

1. **Mobile responsiveness foundation first** (§2, partial) — just the reusable primitives (ResponsiveTable, MobileBottomNav, form-wizard scaffold) before building new UI on top of ad hoc patterns that would need redoing later.
2. **Timetable & Tasks** (§1) — foundational; the Feed's reminder logic (§4) depends on `task_assignments` existing.
3. **Feed & Notifications** (§4) — the "tweet" feature can ship without waiting on Proxy Entry; its reminder plumbing wants Tasks in place first.
4. **Staff-Assisted Data Entry** (§3) — largest surface area (touches four existing modules across all four levels), and benefits from Tasks/Feed already existing so a proxy-entered report can trigger a notification for review.
5. **Mobile responsiveness, pass 2** — apply the primitives from step 1 to every new page built in steps 2–4, plus finish auditing pre-existing pages.

---

## 7. Open Questions to Confirm

- [ ] Should Vicariate/Deanery heads eventually create their own scoped tasks, or should task creation stay Archdiocese-only indefinitely?
- [ ] Is a dedicated `archdiocese_data_entry` role wanted, or should proxy entry simply be available to existing `archdiocese_admin`s (and, later, Vicariate/Deanery heads for their own sub-tree)?
- [ ] Should feed posts eventually support targeting a specific Vicariate/Deanery/Parish, or should the feed always stay a blanket, archdiocese-wide broadcast?
- [ ] For the email digest — daily digest, or immediate send per notification? Daily digest is recommended, to avoid inbox spam and to match "later... a push email" reading as a periodic nudge rather than a transactional email per event.
