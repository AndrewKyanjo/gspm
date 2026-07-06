do $$
begin
  alter type public.report_status add value if not exists 'rejected';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.deanery_report_review_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.parish_reports(id) on delete cascade,
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  action text not null check (action in ('commented', 'approved', 'rejected', 'returned')),
  note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.deanery_report_review_events enable row level security;

drop policy if exists deanery_report_events_select_by_scope on public.deanery_report_review_events;
create policy deanery_report_events_select_by_scope
on public.deanery_report_review_events
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
        (ua.level = 'deanery' and ua.deanery_id = deanery_report_review_events.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = deanery_report_review_events.vicariate_id)
        or ua.role in ('super_admin', 'archdiocese_admin')
      )
  )
);

drop policy if exists deanery_report_events_insert_own_deanery on public.deanery_report_review_events;
create policy deanery_report_events_insert_own_deanery
on public.deanery_report_review_events
for insert
to authenticated
with check (
  app.current_user_is_admin()
  or (
    created_by = auth.uid()
    and exists (
      select 1
      from public.user_assignments ua
      where ua.user_id = auth.uid()
        and ua.is_active = true
        and ua.is_primary = true
        and ua.level = 'deanery'
        and ua.deanery_id = deanery_report_review_events.deanery_id
    )
  )
);
