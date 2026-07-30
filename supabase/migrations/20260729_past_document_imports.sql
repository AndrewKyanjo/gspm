-- ============================================================================
-- Migration: Past Document Import Staging
-- Date:       2026-07-29
-- Feature:    Temporary staged bulk import for historical documents
-- ============================================================================

-- Keep the existing deanery document table tolerant of older code paths that
-- used either storage_path or file_path.
alter table if exists public.deanery_documents
  add column if not exists storage_path text;

alter table if exists public.deanery_documents
  add column if not exists file_path text;

update public.deanery_documents
set storage_path = coalesce(storage_path, file_path),
    file_path = coalesce(file_path, storage_path)
where storage_path is null or file_path is null;

alter table if exists public.parish_documents
  add column if not exists storage_path text;

-- ----------------------------------------------------------------------------
-- Final document tables for scopes that did not have dedicated metadata tables.
-- ----------------------------------------------------------------------------
create table if not exists public.archdiocese_documents (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  category text not null default 'general',
  description text,
  storage_path text not null,
  version_number int not null default 1,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vicariate_documents (
  id uuid primary key default gen_random_uuid(),
  archdiocese_id uuid not null references public.archdioceses(id),
  vicariate_id uuid not null references public.vicariates(id),
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  category text not null default 'general',
  description text,
  storage_path text not null,
  version_number int not null default 1,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.archdiocese_documents enable row level security;
alter table public.vicariate_documents enable row level security;

drop policy if exists archdiocese_documents_select on public.archdiocese_documents;
create policy archdiocese_documents_select
on public.archdiocese_documents
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
        or (ua.level = 'archdiocese' and ua.archdiocese_id = archdiocese_documents.archdiocese_id)
      )
  )
);

drop policy if exists archdiocese_documents_insert on public.archdiocese_documents;
create policy archdiocese_documents_insert
on public.archdiocese_documents
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
      and ua.archdiocese_id = archdiocese_documents.archdiocese_id
  )
);

drop policy if exists vicariate_documents_select on public.vicariate_documents;
create policy vicariate_documents_select
on public.vicariate_documents
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
        or (ua.level = 'vicariate' and ua.vicariate_id = vicariate_documents.vicariate_id)
      )
  )
);

drop policy if exists vicariate_documents_insert on public.vicariate_documents;
create policy vicariate_documents_insert
on public.vicariate_documents
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
      and ua.archdiocese_id = vicariate_documents.archdiocese_id
  )
);

-- ----------------------------------------------------------------------------
-- Staging table
-- ----------------------------------------------------------------------------
create table if not exists public.past_document_imports (
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
  ai_title text,
  ai_description text,
  ai_category text,
  ai_scope_level text
    check (ai_scope_level is null or ai_scope_level in ('archdiocese', 'vicariate', 'deanery', 'parish', 'unknown')),
  ai_confidence numeric,
  ai_reasoning text,
  extracted_text_preview text,
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

alter table public.past_document_imports enable row level security;

drop policy if exists past_document_imports_select on public.past_document_imports;
create policy past_document_imports_select
on public.past_document_imports
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
      and ua.archdiocese_id = past_document_imports.archdiocese_id
  )
);

drop policy if exists past_document_imports_insert on public.past_document_imports;
create policy past_document_imports_insert
on public.past_document_imports
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
      and ua.archdiocese_id = past_document_imports.archdiocese_id
  )
);

drop policy if exists past_document_imports_update on public.past_document_imports;
create policy past_document_imports_update
on public.past_document_imports
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
      and ua.archdiocese_id = past_document_imports.archdiocese_id
  )
);

-- ----------------------------------------------------------------------------
-- Storage buckets
-- ----------------------------------------------------------------------------
do $$
declare
  bucket_names text[] := array[
    'past-document-imports',
    'archdiocese-documents',
    'vicariate-documents'
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
        20971520,
        array[
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/png'
        ]
      );
    end if;
  end loop;
end $$;

drop policy if exists "past_imports_select_authenticated" on storage.objects;
create policy "past_imports_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'past-document-imports');

drop policy if exists "past_imports_insert_authenticated" on storage.objects;
create policy "past_imports_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'past-document-imports');

drop policy if exists "archdiocese_docs_storage_select_authenticated" on storage.objects;
create policy "archdiocese_docs_storage_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'archdiocese-documents');

drop policy if exists "archdiocese_docs_storage_insert_authenticated" on storage.objects;
create policy "archdiocese_docs_storage_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'archdiocese-documents');

drop policy if exists "vicariate_docs_storage_select_authenticated" on storage.objects;
create policy "vicariate_docs_storage_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'vicariate-documents');

drop policy if exists "vicariate_docs_storage_insert_authenticated" on storage.objects;
create policy "vicariate_docs_storage_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'vicariate-documents');

create index if not exists idx_past_document_imports_archdiocese_status
  on public.past_document_imports(archdiocese_id, review_status, created_at desc);

create index if not exists idx_archdiocese_documents_archdiocese
  on public.archdiocese_documents(archdiocese_id) where not is_archived;

create index if not exists idx_vicariate_documents_vicariate
  on public.vicariate_documents(vicariate_id) where not is_archived;
