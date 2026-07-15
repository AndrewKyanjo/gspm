-- ============================================================================
-- Migration: Emitemwa, Good Samaritan Day, project contributions, and rates
-- Date:       2026-07-15
-- Feature:    Contributions module refresh + Vicariate rates
-- ============================================================================

create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Configurable rates on vicariates
-- ----------------------------------------------------------------------------
alter table if exists public.vicariates
  add column if not exists monthly_emitemwa_amount numeric(12, 2) not null default 50000
    check (monthly_emitemwa_amount >= 0),
  add column if not exists good_samaritan_day_amount numeric(12, 2) not null default 250000
    check (good_samaritan_day_amount >= 0);

-- Seed the known 2026 rate model. Rates remain configurable on the vicariate,
-- but existing Mitala Maria records must start with the lower tier.
update public.vicariates
set monthly_emitemwa_amount = 30000,
    good_samaritan_day_amount = 150000
where lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) like '%mitalamaria%'
   or lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) like '%mitlaamaria%';

update public.vicariates
set monthly_emitemwa_amount = 50000,
    good_samaritan_day_amount = 250000
where lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) not like '%mitalamaria%'
  and lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) not like '%mitlaamaria%';

-- ----------------------------------------------------------------------------
-- 2. Mandatory parish contributions: monthly Emitemwa + Good Samaritan Day
-- ----------------------------------------------------------------------------
create table if not exists public.emitemwa_payments (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  recorded_by uuid not null references public.profiles(id),
  payment_kind text not null check (payment_kind in ('monthly', 'good_samaritan_day')),
  contribution_year int not null check (contribution_year between 2000 and 2100),
  contribution_month int check (contribution_month between 1 and 12),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'UGX',
  paid_on date not null,
  payment_method text,
  reference_number text,
  notes text,
  entry_method text not null default 'self_reported'
    check (entry_method in ('self_reported', 'proxy_entered')),
  entered_by uuid references public.profiles(id),
  source_channel text default 'system'
    check (source_channel in ('whatsapp', 'facebook', 'phone_call', 'email', 'in_person', 'system')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint emitemwa_month_kind_check check (
    (payment_kind = 'monthly' and contribution_month is not null)
    or (payment_kind = 'good_samaritan_day' and contribution_month is null)
  )
);

alter table public.emitemwa_payments enable row level security;

drop policy if exists emitemwa_payments_select_by_scope on public.emitemwa_payments;
create policy emitemwa_payments_select_by_scope
on public.emitemwa_payments
for select
to authenticated
using (
  app.current_user_is_admin()
  or exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = emitemwa_payments.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = emitemwa_payments.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = emitemwa_payments.parish_id)
      )
  )
);

drop policy if exists emitemwa_payments_insert_by_scope on public.emitemwa_payments;
create policy emitemwa_payments_insert_by_scope
on public.emitemwa_payments
for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and (
    app.current_user_can_proxy_enter(parish_id)
    or exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'parish'
        and ua.parish_id = emitemwa_payments.parish_id
    )
  )
);

drop policy if exists emitemwa_payments_update_admin_only on public.emitemwa_payments;
create policy emitemwa_payments_update_admin_only
on public.emitemwa_payments
for update
to authenticated
using (app.current_user_is_admin())
with check (app.current_user_is_admin());

drop policy if exists emitemwa_payments_delete_admin_only on public.emitemwa_payments;
create policy emitemwa_payments_delete_admin_only
on public.emitemwa_payments
for delete
to authenticated
using (app.current_user_is_admin());

drop trigger if exists trg_stamp_proxy_entry on public.emitemwa_payments;
create trigger trg_stamp_proxy_entry
  before insert on public.emitemwa_payments
  for each row execute function app.stamp_proxy_entry();

-- ----------------------------------------------------------------------------
-- 3. Scope-first projects and parish project contributions
-- ----------------------------------------------------------------------------
create table if not exists public.contribution_projects (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  created_by uuid not null references public.profiles(id),
  name text not null,
  description text,
  target_amount numeric(12, 2) check (target_amount is null or target_amount >= 0),
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('planned', 'active', 'completed', 'cancelled')),
  scope_level text not null check (scope_level in ('archdiocese', 'vicariate', 'deanery', 'parishes')),
  scope_vicariate_id uuid references public.vicariates(id),
  scope_deanery_id uuid references public.deaneries(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contribution_projects_scope_check check (
    (scope_level = 'archdiocese' and scope_vicariate_id is null and scope_deanery_id is null)
    or (scope_level = 'vicariate' and scope_vicariate_id is not null and scope_deanery_id is null)
    or (scope_level = 'deanery' and scope_deanery_id is not null)
    or (scope_level = 'parishes' and scope_vicariate_id is null and scope_deanery_id is null)
  )
);

create table if not exists public.contribution_project_scope_parishes (
  project_id uuid not null references public.contribution_projects(id) on delete cascade,
  parish_id uuid not null references public.parishes(id),
  primary key (project_id, parish_id)
);

create table if not exists public.project_contribution_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.contribution_projects(id) on delete cascade,
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  recorded_by uuid not null references public.profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'UGX',
  paid_on date not null,
  payment_method text,
  reference_number text,
  notes text,
  entry_method text not null default 'self_reported'
    check (entry_method in ('self_reported', 'proxy_entered')),
  entered_by uuid references public.profiles(id),
  source_channel text default 'system'
    check (source_channel in ('whatsapp', 'facebook', 'phone_call', 'email', 'in_person', 'system')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.contribution_projects enable row level security;
alter table public.contribution_project_scope_parishes enable row level security;
alter table public.project_contribution_payments enable row level security;

drop policy if exists contribution_projects_select_by_scope on public.contribution_projects;
create policy contribution_projects_select_by_scope
on public.contribution_projects
for select
to authenticated
using (
  app.current_user_is_admin()
  or exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (scope_level = 'archdiocese' and ua.archdiocese_id = contribution_projects.archdiocese_id)
        or (scope_level = 'vicariate' and ua.vicariate_id = contribution_projects.scope_vicariate_id)
        or (scope_level = 'deanery' and ua.deanery_id = contribution_projects.scope_deanery_id)
        or (
          scope_level = 'parishes'
          and exists (
            select 1
            from public.contribution_project_scope_parishes cpsp
            where cpsp.project_id = contribution_projects.id
              and cpsp.parish_id = ua.parish_id
          )
        )
      )
  )
);

drop policy if exists contribution_projects_insert_admin_or_staff on public.contribution_projects;
create policy contribution_projects_insert_admin_or_staff
on public.contribution_projects
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in (
        'super_admin',
        'archdiocese_admin',
        'archdiocese_data_entry',
        'vicariate_head',
        'vicariate_staff',
        'deanery_head',
        'deanery_staff'
      )
  )
);

drop policy if exists contribution_projects_update_admin_only on public.contribution_projects;
create policy contribution_projects_update_admin_only
on public.contribution_projects
for update
to authenticated
using (app.current_user_is_admin())
with check (app.current_user_is_admin());

drop policy if exists contribution_scope_parishes_select_by_project on public.contribution_project_scope_parishes;
create policy contribution_scope_parishes_select_by_project
on public.contribution_project_scope_parishes
for select
to authenticated
using (
  exists (
    select 1
    from public.contribution_projects cp
    where cp.id = contribution_project_scope_parishes.project_id
  )
);

drop policy if exists contribution_scope_parishes_insert_admin_or_staff on public.contribution_project_scope_parishes;
create policy contribution_scope_parishes_insert_admin_or_staff
on public.contribution_project_scope_parishes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in (
        'super_admin',
        'archdiocese_admin',
        'archdiocese_data_entry',
        'vicariate_head',
        'vicariate_staff',
        'deanery_head',
        'deanery_staff'
      )
  )
);

drop policy if exists project_contribution_payments_select_by_scope on public.project_contribution_payments;
create policy project_contribution_payments_select_by_scope
on public.project_contribution_payments
for select
to authenticated
using (
  app.current_user_is_admin()
  or exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = project_contribution_payments.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = project_contribution_payments.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = project_contribution_payments.parish_id)
      )
  )
);

drop policy if exists project_contribution_payments_insert_by_scope on public.project_contribution_payments;
create policy project_contribution_payments_insert_by_scope
on public.project_contribution_payments
for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and (
    app.current_user_can_proxy_enter(parish_id)
    or exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'parish'
        and ua.parish_id = project_contribution_payments.parish_id
    )
  )
);

drop policy if exists project_contribution_payments_update_admin_only on public.project_contribution_payments;
create policy project_contribution_payments_update_admin_only
on public.project_contribution_payments
for update
to authenticated
using (app.current_user_is_admin())
with check (app.current_user_is_admin());

drop trigger if exists trg_stamp_proxy_entry on public.project_contribution_payments;
create trigger trg_stamp_proxy_entry
  before insert on public.project_contribution_payments
  for each row execute function app.stamp_proxy_entry();

-- ----------------------------------------------------------------------------
-- 4. Audit log for admin edits to contribution records
-- ----------------------------------------------------------------------------
create table if not exists public.contribution_audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('update', 'delete')),
  changed_by uuid references public.profiles(id),
  previous_value jsonb not null,
  new_value jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.contribution_audit_logs enable row level security;

drop policy if exists contribution_audit_logs_admin_select on public.contribution_audit_logs;
create policy contribution_audit_logs_admin_select
on public.contribution_audit_logs
for select
to authenticated
using (app.current_user_is_admin());

create or replace function app.log_contribution_record_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.contribution_audit_logs (
      table_name,
      record_id,
      action,
      changed_by,
      previous_value,
      new_value
    )
    values (
      tg_table_name,
      old.id,
      'update',
      auth.uid(),
      to_jsonb(old),
      to_jsonb(new)
    );
    new.updated_at := timezone('utc', now());
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.contribution_audit_logs (
      table_name,
      record_id,
      action,
      changed_by,
      previous_value,
      new_value
    )
    values (
      tg_table_name,
      old.id,
      'delete',
      auth.uid(),
      to_jsonb(old),
      null
    );
    return old;
  end if;

  return null;
end;
$$;

revoke all on function app.log_contribution_record_change() from public;

drop trigger if exists trg_log_emitemwa_record_change on public.emitemwa_payments;
create trigger trg_log_emitemwa_record_change
  before update or delete on public.emitemwa_payments
  for each row execute function app.log_contribution_record_change();

drop trigger if exists trg_log_project_contribution_record_change on public.project_contribution_payments;
create trigger trg_log_project_contribution_record_change
  before update or delete on public.project_contribution_payments
  for each row execute function app.log_contribution_record_change();

-- ----------------------------------------------------------------------------
-- 5. Legacy opening-balance import
-- ----------------------------------------------------------------------------
create table if not exists public.contribution_legacy_opening_balances (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid not null references public.parishes(id),
  source_parish_name text not null,
  snapshot_year int not null default 2026,
  paid_amount numeric(12, 2) not null check (paid_amount >= 0),
  balance_amount numeric(12, 2) not null check (balance_amount >= 0),
  currency text not null default 'UGX',
  source_label text not null default 'legacy_ledger_2026_07_15',
  imported_at timestamptz not null default timezone('utc', now()),
  unique (parish_id, source_label)
);

create table if not exists public.contribution_legacy_import_review (
  id uuid primary key default gen_random_uuid(),
  source_parish_name text not null,
  snapshot_year int not null default 2026,
  paid_amount numeric(12, 2) not null check (paid_amount >= 0),
  balance_amount numeric(12, 2) not null check (balance_amount >= 0),
  currency text not null default 'UGX',
  suggested_parish_id uuid references public.parishes(id),
  suggested_parish_name text,
  similarity_score numeric(5, 4),
  review_status text not null default 'needs_review'
    check (review_status in ('needs_review', 'linked', 'ignored')),
  source_label text not null default 'legacy_ledger_2026_07_15',
  created_at timestamptz not null default timezone('utc', now()),
  unique (source_parish_name, source_label)
);

alter table public.contribution_legacy_opening_balances enable row level security;
alter table public.contribution_legacy_import_review enable row level security;

drop policy if exists legacy_opening_balances_select_by_scope on public.contribution_legacy_opening_balances;
create policy legacy_opening_balances_select_by_scope
on public.contribution_legacy_opening_balances
for select
to authenticated
using (
  app.current_user_is_admin()
  or exists (
    select 1
    from public.parishes p
    join public.user_assignments ua
      on ua.user_id = auth.uid()
     and ua.is_active = true
     and ua.is_primary = true
    where p.id = contribution_legacy_opening_balances.parish_id
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = p.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = p.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = p.id)
      )
  )
);

drop policy if exists legacy_import_review_admin_select on public.contribution_legacy_import_review;
create policy legacy_import_review_admin_select
on public.contribution_legacy_import_review
for select
to authenticated
using (app.current_user_is_admin());

with missing_parishes (name, code, deanery_name) as (
  values
    ('Kasenge Parish', 'PAR-KASENGE', 'Nabbingo Deanery'),
    ('Kibibi Parish', 'PAR-KIBIBI', 'Mitala Maria Deanery'),
    ('Mpigi Parish', 'PAR-MPIGI', 'Mpigi Deanery'),
    ('Salaama Parish', 'PAR-SALAAMA', 'Nsambya Deanery')
),
parent_records as (
  select
    missing_parishes.name,
    missing_parishes.code,
    archdioceses.id as archdiocese_id,
    deaneries.id as deanery_id,
    deaneries.vicariate_id
  from missing_parishes
  join public.deaneries deaneries
    on deaneries.name = missing_parishes.deanery_name
  cross join lateral (
    select id
    from public.archdioceses
    order by name
    limit 1
  ) archdioceses
)
insert into public.parishes (
  archdiocese_id,
  vicariate_id,
  deanery_id,
  name,
  code,
  status
)
select
  parent_records.archdiocese_id,
  parent_records.vicariate_id,
  parent_records.deanery_id,
  parent_records.name,
  parent_records.code,
  'active'
from parent_records
where not exists (
  select 1
  from public.parishes existing
  where lower(
    regexp_replace(
      regexp_replace(lower(existing.name), '\mparish\M', '', 'g'),
      '[^a-z0-9]+',
      '',
      'g'
    )
  ) = lower(
    regexp_replace(
      regexp_replace(lower(parent_records.name), '\mparish\M', '', 'g'),
      '[^a-z0-9]+',
      '',
      'g'
    )
  )
);

create temp table temp_legacy_contribution_import (
  source_parish_name text primary key,
  paid_amount numeric(12, 2) not null,
  balance_amount numeric(12, 2) not null
) on commit drop;

insert into temp_legacy_contribution_import (source_parish_name, paid_amount, balance_amount)
values
  ('Bbiina', 300000, 300000),
  ('Bbuto', 0, 600000),
  ('Bugonga', 0, 600000),
  ('Bujuuko', 0, 360000),
  ('Bulo', 0, 360000),
  ('Buloba', 240000, 520000),
  ('Bunnamwaya', 250000, 350000),
  ('Busega', 200000, 400000),
  ('Buyege', 0, 600000),
  ('Bwayise', 0, 600000),
  ('Bweyogerere', 0, 100000),
  ('Christ the King', 0, 600000),
  ('Ggaba', 600000, 0),
  ('Ggayaaza', 300000, 300000),
  ('Ggoli', 30000, 330000),
  ('Ggombe', 125000, 235000),
  ('Jjanya', 200000, 160000),
  ('Jinja-Kaloli', 600000, 0),
  ('Kabulamuliro', 0, 600000),
  ('Kamuli', 100000, 500000),
  ('Kamwokya', 300000, 300000),
  ('Kankobe', 30000, 330000),
  ('Kansanga', 0, 600000),
  ('Kanyanya', 0, 600000),
  ('Kasenge', 150000, 450000),
  ('Katende', 360000, 0),
  ('Kawanda', 0, 600000),
  ('Kibanga', 0, 360000),
  ('Kibibi', 70000, 290000),
  ('Kibiri', 0, 600000),
  ('Kibuye Makindye', 0, 600000),
  ('Kigoowa', 200000, 400000),
  ('Kireka', 0, 600000),
  ('Kisubi', 0, 600000),
  ('Kitagobwa', 150000, 450000),
  ('Kitakyusa', 90000, 270000),
  ('Kiwatule', 600000, 0),
  ('Kiziba', 150000, 210000),
  ('Kkonge Lukuli', 600000, 0),
  ('Kkonge Mpigi', 80000, 280000),
  ('Kyengera', 600000, 0),
  ('Lubaga', 1720000, 0),
  ('Lweza', 175000, 425000),
  ('Mapeera', 0, 600000),
  ('Masajja', 0, 600000),
  ('Matugga', 160000, 440000),
  ('Mbuya', 0, 600000),
  ('Migadde', 0, 360000),
  ('Mitala Maria', 0, 360000),
  ('Mmengo Kisenyi', 0, 600000),
  ('Mpala', 0, 300000),
  ('Mpigi', 180000, 180000),
  ('Muduuma', 0, 360000),
  ('Mulago', 210000, 390000),
  ('Munyonyo', 0, 600000),
  ('Mutundwe', 0, 600000),
  ('Mwereerwe', 250000, 350000),
  ('Nabbingo', 200000, 400000),
  ('Nabitalo', 300000, 300000),
  ('Naddangira', 0, 600000),
  ('Naggulu', 0, 600000),
  ('Nakawuka', 0, 600000),
  ('Nakulabye', 270000, 330000),
  ('Namasuba', 300000, 300000),
  ('Namayumba', 30000, 330000),
  ('Namugongo', 0, 600000),
  ('Nansana', 600000, 0),
  ('Ndeeba', 0, 600000),
  ('Ndejje', 150000, 450000),
  ('Nkozi', 0, 600000),
  ('Nsambya', 300000, 300000),
  ('Ntinda', 600000, 0),
  ('Old Kampala', 0, 600000),
  ('Salaama', 100000, 500000),
  ('Wakiso', 600000, 0);

create temp table temp_legacy_contribution_aliases (
  source_key text primary key,
  parish_key text not null
);

insert into temp_legacy_contribution_aliases (source_key, parish_key)
values
  ('bugonga', 'bugongo'),
  ('bwayise', 'bwayiise'),
  ('jinjakaloli', 'jjinjakalooli'),
  ('mapeera', 'mapeeranabulagala')
on conflict (source_key) do nothing;

create temp table temp_legacy_contribution_matches as
with legacy_normalized as (
  select
    legacy.*,
    lower(
      regexp_replace(
        regexp_replace(lower(legacy.source_parish_name), '\mparish\M', '', 'g'),
        '[^a-z0-9]+',
        '',
        'g'
      )
    ) as source_key
  from temp_legacy_contribution_import legacy
),
parish_normalized as (
  select
    p.id,
    p.name,
    lower(
      regexp_replace(
        regexp_replace(lower(p.name), '\mparish\M', '', 'g'),
        '[^a-z0-9]+',
        '',
        'g'
      )
    ) as parish_key
  from public.parishes p
),
normalized_matches as (
  select
    legacy.source_parish_name,
    legacy.paid_amount,
    legacy.balance_amount,
    p.id as parish_id
  from legacy_normalized legacy
  left join temp_legacy_contribution_aliases aliases
    on aliases.source_key = legacy.source_key
  join parish_normalized p
    on p.parish_key = coalesce(aliases.parish_key, legacy.source_key)
)
select *
from normalized_matches;

insert into public.contribution_legacy_opening_balances (
  parish_id,
  source_parish_name,
  paid_amount,
  balance_amount
)
select parish_id, source_parish_name, paid_amount, balance_amount
from temp_legacy_contribution_matches
on conflict (parish_id, source_label) do update
set source_parish_name = excluded.source_parish_name,
    paid_amount = excluded.paid_amount,
    balance_amount = excluded.balance_amount,
    snapshot_year = excluded.snapshot_year,
    currency = excluded.currency,
    imported_at = timezone('utc', now());

with unmatched as (
  select legacy.*
  from temp_legacy_contribution_import legacy
  where not exists (
    select 1
    from temp_legacy_contribution_matches matches
    where matches.source_parish_name = legacy.source_parish_name
  )
),
suggestions as (
  select distinct on (u.source_parish_name)
    u.source_parish_name,
    u.paid_amount,
    u.balance_amount,
    p.id as suggested_parish_id,
    p.name as suggested_parish_name,
    similarity(lower(u.source_parish_name), lower(p.name)) as similarity_score
  from unmatched u
  left join public.parishes p
    on similarity(lower(u.source_parish_name), lower(p.name)) > 0.35
  order by u.source_parish_name, similarity(lower(u.source_parish_name), lower(p.name)) desc nulls last
)
insert into public.contribution_legacy_import_review (
  source_parish_name,
  paid_amount,
  balance_amount,
  suggested_parish_id,
  suggested_parish_name,
  similarity_score
)
select
  source_parish_name,
  paid_amount,
  balance_amount,
  suggested_parish_id,
  suggested_parish_name,
  similarity_score
from suggestions
on conflict (source_parish_name, source_label) do update
set paid_amount = excluded.paid_amount,
    balance_amount = excluded.balance_amount,
    suggested_parish_id = excluded.suggested_parish_id,
    suggested_parish_name = excluded.suggested_parish_name,
    similarity_score = excluded.similarity_score,
    review_status = 'needs_review';

-- ----------------------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_emitemwa_payments_parish_year
  on public.emitemwa_payments(parish_id, contribution_year, payment_kind, contribution_month);

create index if not exists idx_emitemwa_payments_scope_year
  on public.emitemwa_payments(archdiocese_id, vicariate_id, deanery_id, contribution_year);

create index if not exists idx_contribution_projects_scope
  on public.contribution_projects(archdiocese_id, scope_level, scope_vicariate_id, scope_deanery_id);

create index if not exists idx_project_contribution_payments_project
  on public.project_contribution_payments(project_id, parish_id);

create index if not exists idx_project_contribution_payments_scope_date
  on public.project_contribution_payments(archdiocese_id, vicariate_id, deanery_id, parish_id, paid_on);

create index if not exists idx_legacy_opening_balances_parish
  on public.contribution_legacy_opening_balances(parish_id);

