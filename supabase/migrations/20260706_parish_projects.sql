create table if not exists public.parish_projects (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  created_by uuid not null references public.profiles(id),
  title text not null,
  category text,
  status text not null default 'planned',
  location text,
  description text,
  start_date date,
  target_end_date date,
  budget_amount numeric(12, 2),
  amount_raised numeric(12, 2),
  cover_image_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.parish_projects enable row level security;

drop policy if exists parish_projects_select_by_scope on public.parish_projects;
create policy parish_projects_select_by_scope
on public.parish_projects
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
        (ua.level = 'parish' and ua.parish_id = parish_projects.parish_id)
        or (ua.level = 'deanery' and ua.deanery_id = parish_projects.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = parish_projects.vicariate_id)
        or ua.role in ('super_admin', 'archdiocese_admin')
      )
  )
);

drop policy if exists parish_projects_insert_own_parish on public.parish_projects;
create policy parish_projects_insert_own_parish
on public.parish_projects
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
        and ua.level = 'parish'
        and ua.parish_id = parish_projects.parish_id
    )
  )
);
