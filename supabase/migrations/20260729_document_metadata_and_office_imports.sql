-- ============================================================================
-- Migration: Document Metadata and Office Import Support
-- Date:       2026-07-29
-- Feature:    Saved document metadata for previews/imported files
-- ============================================================================

alter table if exists public.past_document_imports
  add column if not exists document_metadata jsonb not null default '{}'::jsonb,
  add column if not exists detected_created_at timestamptz,
  add column if not exists detected_modified_at timestamptz;

alter table if exists public.archdiocese_documents
  add column if not exists document_metadata jsonb not null default '{}'::jsonb,
  add column if not exists detected_created_at timestamptz,
  add column if not exists detected_modified_at timestamptz;

alter table if exists public.vicariate_documents
  add column if not exists document_metadata jsonb not null default '{}'::jsonb,
  add column if not exists detected_created_at timestamptz,
  add column if not exists detected_modified_at timestamptz;

alter table if exists public.deanery_documents
  add column if not exists document_metadata jsonb not null default '{}'::jsonb,
  add column if not exists detected_created_at timestamptz,
  add column if not exists detected_modified_at timestamptz;

alter table if exists public.parish_documents
  add column if not exists document_metadata jsonb not null default '{}'::jsonb,
  add column if not exists detected_created_at timestamptz,
  add column if not exists detected_modified_at timestamptz;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png'
]
where name in (
  'past-document-imports',
  'archdiocese-documents',
  'vicariate-documents',
  'deanery-documents',
  'parish-documents'
);
