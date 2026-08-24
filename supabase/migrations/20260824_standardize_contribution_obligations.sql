-- Standardize annual Emitemwa obligations and preserve imported overpayments.
--
-- Annual due is always effective monthly rate * 12. Legacy imports are payment
-- history only; they must never redefine what a parish is supposed to pay.

alter table public.contribution_legacy_opening_balances
  add column if not exists source_paid_amount numeric(12, 2),
  add column if not exists source_balance_amount numeric(12, 2),
  add column if not exists normalized_annual_due numeric(12, 2),
  add column if not exists surplus_amount numeric(12, 2) not null default 0
    check (surplus_amount >= 0);

comment on column public.contribution_legacy_opening_balances.source_paid_amount is
  'Original paid amount exactly as imported, retained for audit.';
comment on column public.contribution_legacy_opening_balances.source_balance_amount is
  'Original balance exactly as imported, retained for audit.';
comment on column public.contribution_legacy_opening_balances.normalized_annual_due is
  'Rate-based annual Emitemwa due used when this legacy row was normalized.';
comment on column public.contribution_legacy_opening_balances.surplus_amount is
  'Imported payment above annual Emitemwa due; allocated to Good Samaritan Day, then retained as parish credit.';

update public.contribution_legacy_opening_balances
set source_paid_amount = coalesce(source_paid_amount, paid_amount),
    source_balance_amount = coalesce(source_balance_amount, balance_amount);

with effective_rates as (
  select
    legacy.id,
    coalesce(parish.monthly_emitemwa_amount, vicariate.monthly_emitemwa_amount, 50000)::numeric * 12
      as annual_due
  from public.contribution_legacy_opening_balances legacy
  join public.parishes parish on parish.id = legacy.parish_id
  join public.vicariates vicariate on vicariate.id = parish.vicariate_id
)
update public.contribution_legacy_opening_balances legacy
set normalized_annual_due = effective_rates.annual_due,
    paid_amount = least(coalesce(legacy.source_paid_amount, 0), effective_rates.annual_due),
    balance_amount = greatest(effective_rates.annual_due - coalesce(legacy.source_paid_amount, 0), 0),
    surplus_amount = greatest(coalesce(legacy.source_paid_amount, 0) - effective_rates.annual_due, 0)
from effective_rates
where effective_rates.id = legacy.id;

alter table public.contribution_legacy_opening_balances
  alter column source_paid_amount set not null,
  alter column source_balance_amount set not null,
  alter column normalized_annual_due set not null;

do $$
begin
  if exists (
    select 1
    from public.contribution_legacy_opening_balances
    group by parish_id, snapshot_year
    having count(*) > 1
  ) then
    raise exception 'Multiple legacy contribution snapshots exist for the same parish and year; reconcile them before applying this migration';
  end if;
end;
$$;

alter table public.contribution_legacy_opening_balances
  drop constraint if exists contribution_legacy_opening_balances_parish_id_source_label_key;

create unique index if not exists idx_legacy_opening_balance_parish_year
  on public.contribution_legacy_opening_balances(parish_id, snapshot_year);

create or replace function app.normalize_legacy_contribution_balance()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  annual_due numeric(12, 2);
  imported_paid numeric(12, 2);
  imported_balance numeric(12, 2);
begin
  select coalesce(parish.monthly_emitemwa_amount, vicariate.monthly_emitemwa_amount, 50000) * 12
  into annual_due
  from public.parishes parish
  join public.vicariates vicariate on vicariate.id = parish.vicariate_id
  where parish.id = new.parish_id;

  if annual_due is null then
    raise exception 'Cannot resolve annual Emitemwa due for parish %', new.parish_id;
  end if;

  if tg_op = 'INSERT' then
    imported_paid := coalesce(new.source_paid_amount, new.paid_amount, 0);
    imported_balance := coalesce(new.source_balance_amount, new.balance_amount, 0);
  else
    imported_paid := case
      when new.source_paid_amount is distinct from old.source_paid_amount then new.source_paid_amount
      when new.paid_amount is distinct from old.paid_amount then new.paid_amount
      else old.source_paid_amount
    end;
    imported_balance := case
      when new.source_balance_amount is distinct from old.source_balance_amount then new.source_balance_amount
      when new.balance_amount is distinct from old.balance_amount then new.balance_amount
      else old.source_balance_amount
    end;
  end if;

  new.source_paid_amount := greatest(coalesce(imported_paid, 0), 0);
  new.source_balance_amount := greatest(coalesce(imported_balance, 0), 0);
  new.normalized_annual_due := annual_due;
  new.paid_amount := least(new.source_paid_amount, annual_due);
  new.balance_amount := greatest(annual_due - new.source_paid_amount, 0);
  new.surplus_amount := greatest(new.source_paid_amount - annual_due, 0);
  return new;
end;
$$;

revoke all on function app.normalize_legacy_contribution_balance() from public;

drop trigger if exists trg_normalize_legacy_contribution_balance
  on public.contribution_legacy_opening_balances;
create trigger trg_normalize_legacy_contribution_balance
  before insert or update of
    parish_id,
    paid_amount,
    balance_amount,
    source_paid_amount,
    source_balance_amount
  on public.contribution_legacy_opening_balances
  for each row execute function app.normalize_legacy_contribution_balance();

-- Current rate model audit: every normalized row must now equal 12 monthly rates.
do $$
begin
  if exists (
    select 1
    from public.contribution_legacy_opening_balances legacy
    join public.parishes parish on parish.id = legacy.parish_id
    join public.vicariates vicariate on vicariate.id = parish.vicariate_id
    where legacy.normalized_annual_due <>
      coalesce(parish.monthly_emitemwa_amount, vicariate.monthly_emitemwa_amount, 50000) * 12
  ) then
    raise exception 'Legacy contribution normalization produced a non-standard annual due';
  end if;
end;
$$;

-- Generated reports are reproducible snapshots. Remove unpublished 2026
-- snapshots created with the former legacy-target calculation so operators
-- cannot accidentally publish stale balances.
delete from public.generated_monthly_reports
where report_year = 2026
  and status = 'generated';
