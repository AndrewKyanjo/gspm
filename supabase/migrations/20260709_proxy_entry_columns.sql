-- ============================================================================
-- Migration: Staff-Assisted (Proxy) Data Entry
-- Date:       2026-07-09
-- Feature:    Section 3 of TODO.md
--
-- Adds:
--   1. archdiocese_data_entry role to app_role enum
--   2. entry_method, entered_by, source_channel columns to parish_reports,
--      parish_contributions, and parish_projects
--   3. app.stamp_proxy_entry() trigger — auto-stamps entry_method and
--      entered_by on INSERT so the client cannot misrepresent the mode
--   4. app.current_user_can_proxy_enter() helper — used by RLS to allow
--      ancestor-scope roles to INSERT on behalf of descendant parishes
--   5. Updated INSERT RLS policies on all three tables
--   6. Updated app.validate_role_level_pair() for the new role
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add archdiocese_data_entry to the app_role enum
-- ----------------------------------------------------------------------------
do $$
begin
  alter type public.app_role add value if not exists 'archdiocese_data_entry';
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Add proxy-entry columns to parish_reports
-- ----------------------------------------------------------------------------
alter table if exists public.parish_reports
  add column if not exists entry_method    text not null default 'self_reported'
    check (entry_method in ('self_reported', 'proxy_entered')),
  add column if not exists entered_by      uuid references public.profiles(id),
  add column if not exists source_channel  text default 'system'
    check (source_channel in ('whatsapp', 'facebook', 'phone_call', 'email', 'in_person', 'system'));

-- ----------------------------------------------------------------------------
-- 3. Add proxy-entry columns to parish_contributions
-- ----------------------------------------------------------------------------
alter table if exists public.parish_contributions
  add column if not exists entry_method    text not null default 'self_reported'
    check (entry_method in ('self_reported', 'proxy_entered')),
  add column if not exists entered_by      uuid references public.profiles(id),
  add column if not exists source_channel  text default 'system'
    check (source_channel in ('whatsapp', 'facebook', 'phone_call', 'email', 'in_person', 'system'));

-- ----------------------------------------------------------------------------
-- 4. Add proxy-entry columns to parish_projects
-- ----------------------------------------------------------------------------
alter table if exists public.parish_projects
  add column if not exists entry_method    text not null default 'self_reported'
    check (entry_method in ('self_reported', 'proxy_entered')),
  add column if not exists entered_by      uuid references public.profiles(id),
  add column if not exists source_channel  text default 'system'
    check (source_channel in ('whatsapp', 'facebook', 'phone_call', 'email', 'in_person', 'system'));

-- ----------------------------------------------------------------------------
-- 5. Helper: can the current user proxy-enter data for a given parish?
--
-- Returns true when the authenticated user:
--   - is super_admin, archdiocese_admin, or archdiocese_data_entry
--   - is assigned at the vicariate level and the target parish belongs to
--     that vicariate
--   - is assigned at the deanery level and the target parish belongs to
--     that deanery
--
-- Used both by RLS policies and (as a TypeScript mirror) by the permission
-- helpers in src/lib/permissions/access.ts.
-- ----------------------------------------------------------------------------
create or replace function app.current_user_can_proxy_enter(
  p_parish_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_assignment record;
begin
  -- Fetch the caller's primary active assignment.
  select ua.role, ua.level, ua.vicariate_id, ua.deanery_id, ua.parish_id
  into v_assignment
  from public.user_assignments ua
  where ua.user_id = auth.uid()
    and ua.is_active = true
    and ua.is_primary = true
  limit 1;

  if not found then
    return false;
  end if;

  -- Admins and dedicated data-entry staff can proxy for any parish in the
  -- archdiocese.
  if v_assignment.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry') then
    return true;
  end if;

  -- Vicariate-level staff can proxy for parishes under their vicariate.
  if v_assignment.level = 'vicariate' and v_assignment.vicariate_id is not null then
    return exists (
      select 1 from public.parishes p
      where p.id = p_parish_id
        and p.vicariate_id = v_assignment.vicariate_id
    );
  end if;

  -- Deanery-level staff can proxy for parishes under their deanery.
  if v_assignment.level = 'deanery' and v_assignment.deanery_id is not null then
    return exists (
      select 1 from public.parishes p
      where p.id = p_parish_id
        and p.deanery_id = v_assignment.deanery_id
    );
  end if;

  return false;
end;
$$;

-- Revoke from public; only authenticated users should call this.
revoke all on function app.current_user_can_proxy_enter(uuid) from public;
grant execute on function app.current_user_can_proxy_enter(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Trigger function: stamp_proxy_entry
--
-- Fires BEFORE INSERT on parish_reports, parish_contributions, and
-- parish_projects.  Compares the inserting user's primary active parish
-- scope to the record's parish_id:
--
--   match    → entry_method = 'self_reported', entered_by = NULL
--   mismatch → entry_method = 'proxy_entered', entered_by = auth.uid()
--
-- The client MAY still supply source_channel; the trigger only stamps the
-- fields that must not be trusted from client input.
-- ----------------------------------------------------------------------------
create or replace function app.stamp_proxy_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_parish_id uuid;
begin
  -- Only stamp on INSERT.  UPDATEs of a proxy-entered row leave the original
  -- stamp in place (the person who first typed it in is a historical fact).
  if tg_op <> 'INSERT' then
    return new;
  end if;

  -- Find the caller's primary active parish scope.
  select ua.parish_id
  into v_user_parish_id
  from public.user_assignments ua
  where ua.user_id = auth.uid()
    and ua.is_active = true
    and ua.is_primary = true
  limit 1;

  -- Compare.  NULL-safe: if either side is NULL the IS NOT DISTINCT FROM
  -- comparison handles it correctly.
  if new.parish_id is not distinct from v_user_parish_id then
    -- The caller IS the parish — self-reported.
    new.entry_method := 'self_reported';
    new.entered_by   := null;
    if new.source_channel is null then
      new.source_channel := 'system';
    end if;
  else
    -- The caller is NOT the parish (or has no parish scope) — proxy entry.
    new.entry_method := 'proxy_entered';
    new.entered_by   := auth.uid();
    -- source_channel is left as whatever the client supplied (or NULL if not
    -- provided — the application layer should always set it for proxy entry).
    if new.source_channel is null then
      new.source_channel := 'system';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function app.stamp_proxy_entry() from public;

-- ----------------------------------------------------------------------------
-- 7. Attach the stamping trigger to each table
-- ----------------------------------------------------------------------------
drop trigger if exists trg_stamp_proxy_entry on public.parish_reports;
create trigger trg_stamp_proxy_entry
  before insert on public.parish_reports
  for each row execute function app.stamp_proxy_entry();

drop trigger if exists trg_stamp_proxy_entry on public.parish_contributions;
create trigger trg_stamp_proxy_entry
  before insert on public.parish_contributions
  for each row execute function app.stamp_proxy_entry();

drop trigger if exists trg_stamp_proxy_entry on public.parish_projects;
create trigger trg_stamp_proxy_entry
  before insert on public.parish_projects
  for each row execute function app.stamp_proxy_entry();

-- ----------------------------------------------------------------------------
-- 8. Update INSERT RLS policies to allow proxy entry
--
-- The existing INSERT policies allow:
--   (a) app.current_user_is_admin(), OR
--   (b) the user's own parish scope matches the record
--
-- We add a third branch:
--   (c) app.current_user_can_proxy_enter(record.parish_id)
--
-- This lets archdiocese_data_entry, vicariate, and deanery staff insert on
-- behalf of parishes they oversee — matching the canProxyEnterForScope()
-- TypeScript helper in src/lib/permissions/access.ts.
-- ----------------------------------------------------------------------------

-- --- parish_contributions ---
drop policy if exists parish_contributions_insert_own_parish on public.parish_contributions;
create policy parish_contributions_insert_own_parish
on public.parish_contributions
for insert
to authenticated
with check (
  app.current_user_is_admin()
  or app.current_user_can_proxy_enter(parish_id)
  or (
    recorded_by = auth.uid()
    and exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'parish'
        and ua.parish_id = parish_contributions.parish_id
    )
  )
);

-- --- parish_projects ---
drop policy if exists parish_projects_insert_own_parish on public.parish_projects;
create policy parish_projects_insert_own_parish
on public.parish_projects
for insert
to authenticated
with check (
  app.current_user_is_admin()
  or app.current_user_can_proxy_enter(parish_id)
  or (
    created_by = auth.uid()
    and exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'parish'
        and ua.parish_id = parish_projects.parish_id
    )
  )
);

-- --- parish_reports ---
-- The existing INSERT policy for parish_reports may exist from the base
-- schema.  We drop and re-create if it exists, or create it fresh.
do $$
declare
  v_policy_exists boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parish_reports'
      and policyname = 'parish_reports_insert_own_parish'
  ) into v_policy_exists;

  if v_policy_exists then
    execute 'drop policy parish_reports_insert_own_parish on public.parish_reports';
  end if;
end $$;

create policy parish_reports_insert_own_parish
on public.parish_reports
for insert
to authenticated
with check (
  app.current_user_is_admin()
  or app.current_user_can_proxy_enter(parish_id)
  or (
    prepared_by = auth.uid()
    and exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'parish'
        and ua.parish_id = parish_reports.parish_id
    )
  )
);

-- ----------------------------------------------------------------------------
-- 9. Update app.validate_role_level_pair() for archdiocese_data_entry
--
-- The new role belongs to the archdiocese level alongside super_admin and
-- archdiocese_admin.  The SQL function must match the TypeScript mirror in
-- src/lib/permissions/roles.ts (ROLES_BY_LEVEL).
-- ----------------------------------------------------------------------------
create or replace function app.validate_role_level_pair(
  p_role public.app_role,
  p_level public.hierarchy_level
)
returns boolean
language sql
immutable
as $$
  select case
    when p_level = 'archdiocese' then p_role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
    when p_level = 'vicariate'   then p_role in ('vicariate_head', 'vicariate_staff')
    when p_level = 'deanery'     then p_role in ('deanery_head', 'deanery_staff')
    when p_level = 'parish'      then p_role in ('parish_head', 'parish_data_entry')
    else false
  end;
$$;

revoke all on function app.validate_role_level_pair(public.app_role, public.hierarchy_level) from public;
grant execute on function app.validate_role_level_pair(public.app_role, public.hierarchy_level) to authenticated;

-- ----------------------------------------------------------------------------
-- 10. Also update the approval RPC wrappers so the archdiocese_data_entry
--     role can be assigned during registration approval.
--
-- The public.approve_registration_request() wrapper delegates to
-- app.approve_registration_request(), which calls
-- app.assert_current_user_is_admin().  Since archdiocese_data_entry should
-- NOT have approval powers, we keep that gate as-is.  But
-- validate_role_level_pair() now accepts archdiocese_data_entry, so the
-- approval RPC itself won't reject the role — only the admin check will.
-- This is the correct behaviour: an admin approves a registration and can
-- assign the archdiocese_data_entry role.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 11. Add helpful indexes for the new columns
-- ----------------------------------------------------------------------------
create index if not exists idx_parish_reports_entry_method
  on public.parish_reports(entry_method) where entry_method = 'proxy_entered';

create index if not exists idx_parish_contributions_entry_method
  on public.parish_contributions(entry_method) where entry_method = 'proxy_entered';

create index if not exists idx_parish_projects_entry_method
  on public.parish_projects(entry_method) where entry_method = 'proxy_entered';
