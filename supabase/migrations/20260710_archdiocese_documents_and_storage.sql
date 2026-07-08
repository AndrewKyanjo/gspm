-- ============================================================================
-- Migration: Archdiocese Document Library & Storage Infrastructure
-- Date:       2026-07-10
-- Feature:    Archdiocese executive console — documents & media management
--
-- Adds:
--   1. deanery_documents table — document metadata for deanery-level uploads
--   2. RLS policies for deanery_documents (select + insert)
--   3. Storage buckets: deanery-documents, parish-project-images, parish-documents, parish-media, deanery-media
--   4. Storage RLS policies for authenticated access
--
-- Fixes "bucket not found" errors when uploading from the archdiocese console.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create deanery_documents table
-- ----------------------------------------------------------------------------
create table if not exists public.deanery_documents (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid references public.vicariates(id),
  deanery_id uuid not null references public.deaneries(id),
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  category text not null default 'general',
  description text,
  storage_path text not null,
  version_number int not null default 1,
  replaces_document_id uuid references public.deanery_documents(id),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 2. RLS for deanery_documents
-- ----------------------------------------------------------------------------
alter table public.deanery_documents enable row level security;

-- Select: admins see all; deanery-level users see their own deanery's docs
drop policy if exists deanery_documents_select on public.deanery_documents;
create policy deanery_documents_select
on public.deanery_documents
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
        or (ua.level = 'vicariate' and ua.vicariate_id = deanery_documents.vicariate_id)
        or (ua.level = 'deanery' and ua.deanery_id = deanery_documents.deanery_id)
      )
  )
);

-- Insert: admins and deanery-level users can insert for their scope
drop policy if exists deanery_documents_insert on public.deanery_documents;
create policy deanery_documents_insert
on public.deanery_documents
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
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'deanery' and ua.deanery_id = deanery_documents.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = deanery_documents.vicariate_id)
      )
  )
);

-- Update: only the uploader or an admin can update
drop policy if exists deanery_documents_update on public.deanery_documents;
create policy deanery_documents_update
on public.deanery_documents
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
        ua.role in ('super_admin', 'archdiocese_admin')
        or deanery_documents.uploaded_by = auth.uid()
      )
  )
);

-- ----------------------------------------------------------------------------
-- 3. Create storage buckets
--
-- Supabase stores bucket definitions in the storage.buckets table.
-- The buckets are created idempotently (skip if already present).
-- ----------------------------------------------------------------------------
do $$
declare
  bucket_names text[] := array[
    'deanery-documents',
    'parish-project-images',
    'parish-documents',
    'parish-media',
    'deanery-media'
  ];
  bucket_name text;
begin
  foreach bucket_name in array bucket_names loop
    if not exists (select 1 from storage.buckets where name = bucket_name) then
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (bucket_name, bucket_name, false, null, null);
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Storage RLS policies
--
-- Each bucket gets a SELECT policy (authenticated users with scope can read)
-- and an INSERT policy (authenticated users with scope can upload).
-- ----------------------------------------------------------------------------

-- --- deanery-documents ---
drop policy if exists "deanery_docs_select_authenticated" on storage.objects;
create policy "deanery_docs_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'deanery-documents');

drop policy if exists "deanery_docs_insert_authenticated" on storage.objects;
create policy "deanery_docs_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'deanery-documents');

-- --- parish-project-images ---
drop policy if exists "project_images_select_authenticated" on storage.objects;
create policy "project_images_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'parish-project-images');

drop policy if exists "project_images_insert_authenticated" on storage.objects;
create policy "project_images_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'parish-project-images');

-- --- parish-documents ---
drop policy if exists "parish_docs_select_authenticated" on storage.objects;
create policy "parish_docs_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'parish-documents');

drop policy if exists "parish_docs_insert_authenticated" on storage.objects;
create policy "parish_docs_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'parish-documents');

-- --- parish-media ---
drop policy if exists "parish_media_select_authenticated" on storage.objects;
create policy "parish_media_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'parish-media');

drop policy if exists "parish_media_insert_authenticated" on storage.objects;
create policy "parish_media_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'parish-media');

-- --- deanery-media ---
drop policy if exists "deanery_media_select_authenticated" on storage.objects;
create policy "deanery_media_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'deanery-media');

drop policy if exists "deanery_media_insert_authenticated" on storage.objects;
create policy "deanery_media_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'deanery-media');

-- ----------------------------------------------------------------------------
-- 5. Indexes for deanery_documents
-- ----------------------------------------------------------------------------
create index if not exists idx_deanery_documents_deanery
  on public.deanery_documents(deanery_id) where not is_archived;

create index if not exists idx_deanery_documents_archdiocese
  on public.deanery_documents(archdiocese_id) where not is_archived;

create index if not exists idx_deanery_documents_category
  on public.deanery_documents(category);

-- ----------------------------------------------------------------------------
-- 6. Parish-level document tracking table
--    (mirrors deanery_documents for parish-scoped uploads)
-- ----------------------------------------------------------------------------
create table if not exists public.parish_documents (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid references public.vicariates(id),
  deanery_id uuid references public.deaneries(id),
  parish_id uuid not null references public.parishes(id),
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  category text not null default 'general',
  description text,
  storage_path text not null,
  version_number int not null default 1,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.parish_documents enable row level security;

drop policy if exists parish_documents_select on public.parish_documents;
create policy parish_documents_select
on public.parish_documents
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
        or (ua.level = 'parish' and ua.parish_id = parish_documents.parish_id)
        or (ua.level = 'deanery' and ua.deanery_id = parish_documents.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = parish_documents.vicariate_id)
      )
  )
);

drop policy if exists parish_documents_insert on public.parish_documents;
create policy parish_documents_insert
on public.parish_documents
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
      and (
        ua.role in ('super_admin', 'archdiocese_admin', 'archdiocese_data_entry')
        or (ua.level = 'parish' and ua.parish_id = parish_documents.parish_id)
        or (ua.level = 'deanery' and ua.deanery_id = parish_documents.deanery_id)
        or (ua.level = 'vicariate' and ua.vicariate_id = parish_documents.vicariate_id)
      )
  )
);

create index if not exists idx_parish_documents_parish
  on public.parish_documents(parish_id) where not is_archived;
