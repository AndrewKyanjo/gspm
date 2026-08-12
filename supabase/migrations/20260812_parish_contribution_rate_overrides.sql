-- Migration: Parish-level contribution rate overrides
-- Adds per-parish rate columns so individual parishes can have custom
-- Emitemwa / Good Samaritan Day rates that differ from their vicariate.
-- NULL means "inherit from vicariate".

ALTER TABLE public.parishes
  ADD COLUMN IF NOT EXISTS monthly_emitemwa_amount numeric(12, 2),
  ADD COLUMN IF NOT EXISTS good_samaritan_day_amount numeric(12, 2);

COMMENT ON COLUMN public.parishes.monthly_emitemwa_amount IS
  'Custom monthly Emitemwa rate for this parish. NULL = use vicariate rate.';
COMMENT ON COLUMN public.parishes.good_samaritan_day_amount IS
  'Custom Good Samaritan Day rate for this parish. NULL = use vicariate rate.';
