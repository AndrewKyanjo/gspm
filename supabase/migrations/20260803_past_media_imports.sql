-- ============================================================================
-- Migration: Past Media Import Staging
-- Date:       2026-08-03
-- Feature:    Temporary staged bulk import for historical media
-- ============================================================================

create table if not exists public.past_media_imports (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  uploaded_by uuid not null references public.profiles(id),
  original_filename text not null,
  staging_storage_path text not null,
  final_storage_path text,
  file_type text not null,
  file_size bigint not null,
  title text,
  description text,
  category text not null default 'general',
  scope_level text not null default 'unknown'
    check (scope_level in ('archdiocese', 'vicariate', 'deanery', 'parish', 'unknown')),
  vicariate_id uuid references public.vicariates(id),
  deanery_id uuid references public.deaneries(id),
  parish_id uuid references public.parishes(id),
  captured_on date,
  detected_taken_at timestamptz,
  image_metadata jsonb not null default '{}'::jsonb,
  ai_title text,
  ai_description text,
  ai_category text,
  ai_scope_level text
    check (ai_scope_level is null or ai_scope_level in ('archdiocese', 'vicariate', 'deanery', 'parish', 'unknown')),
  ai_confidence numeric,
  ai_reasoning text,
  review_status text not null default 'uploaded'
    check (review_status in ('uploaded', 'scanning', 'scanned', 'needs_review', 'ready_for_upload', 'published', 'failed', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.past_media_imports enable row level security;

drop policy if exists past_media_imports_select on public.past_media_imports;
create policy past_media_imports_select
on public.past_media_imports
for select
to authenticated
using (
  exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
      and ua.archdiocese_id = past_media_imports.archdiocese_id
  )
);

drop policy if exists past_media_imports_insert on public.past_media_imports;
create policy past_media_imports_insert
on public.past_media_imports
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
      and ua.archdiocese_id = past_media_imports.archdiocese_id
  )
);

drop policy if exists past_media_imports_update on public.past_media_imports;
create policy past_media_imports_update
on public.past_media_imports
for update
to authenticated
using (
  exists (
    select 1
    from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
      and ua.archdiocese_id = past_media_imports.archdiocese_id
  )
);

do $$
declare
  bucket_names text[] := array[
    'past-media-imports',
    'archdiocese-media',
    'vicariate-media',
    'deanery-media',
    'parish-media'
  ];
  bucket_name text;
begin
  foreach bucket_name in array bucket_names loop
    if not exists (select 1 from storage.buckets where name = bucket_name) then
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (
        bucket_name,
        bucket_name,
        false,
        12582912,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
      );
    end if;
  end loop;
end $$;

drop policy if exists "past_media_imports_select_authenticated" on storage.objects;
create policy "past_media_imports_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'past-media-imports');

drop policy if exists "past_media_imports_insert_authenticated" on storage.objects;
create policy "past_media_imports_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'past-media-imports');

drop policy if exists "archdiocese_media_select_authenticated" on storage.objects;
create policy "archdiocese_media_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'archdiocese-media');

drop policy if exists "archdiocese_media_insert_authenticated" on storage.objects;
create policy "archdiocese_media_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'archdiocese-media');

drop policy if exists "vicariate_media_select_authenticated" on storage.objects;
create policy "vicariate_media_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'vicariate-media');

drop policy if exists "vicariate_media_insert_authenticated" on storage.objects;
create policy "vicariate_media_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'vicariate-media');

create index if not exists idx_past_media_imports_archdiocese_status
  on public.past_media_imports(archdiocese_id, review_status, created_at desc);

create index if not exists idx_past_media_imports_scope
  on public.past_media_imports(scope_level, vicariate_id, deanery_id, parish_id)
  where review_status = 'published';
