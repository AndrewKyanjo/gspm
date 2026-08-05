-- ============================================================================
-- Data Export: Contributions Before Smart-Allocation Migration
-- Date:       2026-08-05
-- Purpose:    Safety snapshot of all contribution data before logic changes.
--             Run these queries in the Supabase SQL Editor and save results.
-- ============================================================================

-- 1. All Emitemwa payments (mandatory contributions)
SELECT * FROM public.emitemwa_payments ORDER BY created_at;

-- 2. Summary: Emitemwa payments by parish and year
SELECT
  p.name AS parish_name,
  ep.contribution_year,
  ep.payment_kind,
  COUNT(*) AS payment_count,
  SUM(ep.amount) AS total_amount
FROM public.emitemwa_payments ep
JOIN public.parishes p ON p.id = ep.parish_id
GROUP BY p.name, ep.contribution_year, ep.payment_kind
ORDER BY p.name, ep.contribution_year, ep.payment_kind;

-- 3. All parish contributions (general/bulk contributions)
SELECT * FROM public.parish_contributions ORDER BY created_at;

-- 4. All legacy opening balances
SELECT
  clob.*,
  p.name AS parish_name
FROM public.contribution_legacy_opening_balances clob
JOIN public.parishes p ON p.id = clob.parish_id
ORDER BY clob.snapshot_year, p.name;

-- 5. Vicariate rates (what each parish should pay)
SELECT
  v.name AS vicariate_name,
  v.monthly_emitemwa_amount,
  v.good_samaritan_day_amount
FROM public.vicariates v
ORDER BY v.name;

-- 6. Parish count by vicariate (for context)
SELECT
  v.name AS vicariate_name,
  COUNT(p.id) AS parish_count
FROM public.vicariates v
LEFT JOIN public.parishes p ON p.vicariate_id = v.id
GROUP BY v.name
ORDER BY v.name;
