-- ============================================================================
-- Migration: Akabondo Evaluations and Parish Needs
-- Date:       2026-07-29
-- Feature:    Parish lower-level evaluation capture and needs analysis
-- ============================================================================

create table if not exists public.sub_parishes (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (parish_id, name)
);

create table if not exists public.akabondos (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  sub_parish_id uuid not null references public.sub_parishes(id),
  name text not null,
  village_name text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (sub_parish_id, name)
);

create table if not exists public.akabondo_evaluations (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  sub_parish_id uuid not null references public.sub_parishes(id),
  akabondo_id uuid not null references public.akabondos(id),
  entered_by uuid not null references public.profiles(id),
  person_name text not null,
  age int check (age is null or (age >= 0 and age <= 130)),
  gender text check (gender is null or gender in ('male', 'female', 'unknown')),
  contact_number text,
  village text,
  challenge_sick boolean not null default false,
  challenge_aged boolean not null default false,
  challenge_unemployed boolean not null default false,
  challenge_disabled boolean not null default false,
  challenge_other text,
  assistance_food boolean not null default false,
  assistance_shelter boolean not null default false,
  assistance_bedding boolean not null default false,
  assistance_clothing boolean not null default false,
  assistance_medical boolean not null default false,
  assistance_education boolean not null default false,
  assistance_financial boolean not null default false,
  assistance_other text,
  additional_information text,
  evaluated_on date not null default current_date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.parish_needs (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  created_by uuid not null references public.profiles(id),
  need_type text not null check (need_type in ('food', 'shelter', 'bedding', 'clothing', 'medical', 'education', 'financial', 'other')),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  source text not null default 'manual' check (source in ('manual', 'akabondo_analysis')),
  estimated_households int check (estimated_households is null or estimated_households >= 0),
  status text not null default 'open' check (status in ('open', 'in_progress', 'met', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sub_parishes enable row level security;
alter table public.akabondos enable row level security;
alter table public.akabondo_evaluations enable row level security;
alter table public.parish_needs enable row level security;

-- Select policies
drop policy if exists sub_parishes_select on public.sub_parishes;
create policy sub_parishes_select on public.sub_parishes for select to authenticated using (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = sub_parishes.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = sub_parishes.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = sub_parishes.parish_id)
      )
  )
);

drop policy if exists akabondos_select on public.akabondos;
create policy akabondos_select on public.akabondos for select to authenticated using (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = akabondos.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = akabondos.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = akabondos.parish_id)
      )
  )
);

drop policy if exists akabondo_evaluations_select on public.akabondo_evaluations;
create policy akabondo_evaluations_select on public.akabondo_evaluations for select to authenticated using (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = akabondo_evaluations.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = akabondo_evaluations.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = akabondo_evaluations.parish_id)
      )
  )
);

drop policy if exists parish_needs_select on public.parish_needs;
create policy parish_needs_select on public.parish_needs for select to authenticated using (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'vicariate' and ua.vicariate_id = parish_needs.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = parish_needs.deanery_id)
        or (ua.level = 'parish' and ua.parish_id = parish_needs.parish_id)
      )
  )
);

-- Insert policies
drop policy if exists sub_parishes_insert on public.sub_parishes;
create policy sub_parishes_insert on public.sub_parishes for insert to authenticated with check (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'parish' and ua.parish_id = sub_parishes.parish_id)
      )
  )
);

drop policy if exists akabondos_insert on public.akabondos;
create policy akabondos_insert on public.akabondos for insert to authenticated with check (
  exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'parish' and ua.parish_id = akabondos.parish_id)
      )
  )
);

drop policy if exists akabondo_evaluations_insert on public.akabondo_evaluations;
create policy akabondo_evaluations_insert on public.akabondo_evaluations for insert to authenticated with check (
  entered_by = auth.uid()
  and exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'parish' and ua.parish_id = akabondo_evaluations.parish_id)
      )
  )
);

drop policy if exists parish_needs_insert on public.parish_needs;
create policy parish_needs_insert on public.parish_needs for insert to authenticated with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid() and ua.is_active = true and ua.is_primary = true
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'parish' and ua.parish_id = parish_needs.parish_id)
      )
  )
);

create index if not exists idx_sub_parishes_parish on public.sub_parishes(parish_id, name);
create index if not exists idx_akabondos_sub_parish on public.akabondos(sub_parish_id, name);
create index if not exists idx_akabondo_evaluations_parish on public.akabondo_evaluations(parish_id, created_at desc);
create index if not exists idx_akabondo_evaluations_akabondo on public.akabondo_evaluations(akabondo_id, created_at desc);
create index if not exists idx_parish_needs_parish on public.parish_needs(parish_id, status, priority);
