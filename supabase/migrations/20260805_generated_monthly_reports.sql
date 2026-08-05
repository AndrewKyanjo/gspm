-- ============================================================================
-- Migration: Generated Monthly Reports
-- Date:       2026-08-05
-- Feature:    Auto-generated monthly composite reports at all hierarchy levels
-- ============================================================================

create table if not exists public.generated_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  scope_level text not null check (scope_level in ('archdiocese', 'vicariate', 'deanery', 'parish')),
  scope_entity_id uuid not null,
  report_year int not null check (report_year between 2000 and 2100),
  report_month int not null check (report_month between 1 and 12),

  -- Financial summary (JSON blob for flexibility)
  financial_data jsonb not null default '{}'::jsonb,

  -- Project summary
  project_data jsonb not null default '{}'::jsonb,

  -- Document registry
  document_data jsonb not null default '{}'::jsonb,

  -- Status & audit
  status text not null default 'generated' check (status in ('generated', 'reviewed', 'published')),
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,

  unique (scope_level, scope_entity_id, report_year, report_month)
);

alter table public.generated_monthly_reports enable row level security;

drop policy if exists generated_monthly_reports_select on public.generated_monthly_reports;
create policy generated_monthly_reports_select
on public.generated_monthly_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level::text = 'vicariate' and ua.vicariate_id = generated_monthly_reports.scope_entity_id and generated_monthly_reports.scope_level = 'vicariate')
        or (ua.level::text = 'deanery' and ua.deanery_id = generated_monthly_reports.scope_entity_id and generated_monthly_reports.scope_level = 'deanery')
        or (ua.level::text = 'parish' and ua.parish_id = generated_monthly_reports.scope_entity_id and generated_monthly_reports.scope_level = 'parish')
      )
  )
);

drop policy if exists generated_monthly_reports_insert on public.generated_monthly_reports;
create policy generated_monthly_reports_insert
on public.generated_monthly_reports
for insert
to authenticated
with check (
  generated_by = auth.uid()
  and exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
  )
);

drop policy if exists generated_monthly_reports_update on public.generated_monthly_reports;
create policy generated_monthly_reports_update
on public.generated_monthly_reports
for update
to authenticated
using (
  exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level::text = generated_monthly_reports.scope_level and
            (ua.vicariate_id = generated_monthly_reports.scope_entity_id or
             ua.deanery_id = generated_monthly_reports.scope_entity_id or
             ua.parish_id = generated_monthly_reports.scope_entity_id))
      )
  )
);

create index if not exists idx_generated_monthly_reports_scope
  on public.generated_monthly_reports(scope_level, scope_entity_id, report_year desc, report_month desc);
