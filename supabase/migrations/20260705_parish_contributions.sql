create table if not exists public.parish_contributions (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  recorded_by uuid not null references public.profiles(id),
  contributor_name text not null,
  contribution_type text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'UGX',
  contributed_on date not null,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.parish_contributions enable row level security;

drop policy if exists parish_contributions_select_by_scope on public.parish_contributions;
create policy parish_contributions_select_by_scope
on public.parish_contributions
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
        (ua.level = 'parish' and ua.parish_id = parish_contributions.parish_id)
        or (ua.level = 'deanery' and ua.deanery_id = parish_contributions.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = parish_contributions.vicariate_id)
        or ua.role in ('super_admin', 'archdiocese_admin')
      )
  )
);

drop policy if exists parish_contributions_insert_own_parish on public.parish_contributions;
create policy parish_contributions_insert_own_parish
on public.parish_contributions
for insert
to authenticated
with check (
  app.current_user_is_admin()
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
