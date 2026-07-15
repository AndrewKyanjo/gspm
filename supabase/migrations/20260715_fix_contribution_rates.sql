-- ============================================================================
-- Migration: Correct 2026 contribution rate seeds
-- Date:       2026-07-15
-- Feature:    Mitala Maria Emitemwa rate correction
-- ============================================================================

alter table if exists public.vicariates
  add column if not exists monthly_emitemwa_amount numeric(12, 2) not null default 50000
    check (monthly_emitemwa_amount >= 0),
  add column if not exists good_samaritan_day_amount numeric(12, 2) not null default 250000
    check (good_samaritan_day_amount >= 0);

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
