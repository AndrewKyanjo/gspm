-- Requested parish configuration corrections. Preserve IDs, codes and all
-- recorded payments and legacy opening balances. Parish rate overrides must
-- already exist (20260812_parish_contribution_rate_overrides.sql).

do $$
begin
  if (select count(*) from public.parishes
      where btrim(name) ~* '^bugong[ao](\s+parish)?$') > 1 then
    raise exception 'Multiple Bugongo/Bugonga parishes found; resolve the name collision before applying corrections';
  end if;

  if exists (
    select 1 from public.parishes
    where btrim(name) ~* '^(namayumba|naddangira)(\s+parish)?$'
    group by lower(regexp_replace(btrim(name), '\s+parish$', '', 'i'))
    having count(*) > 1
  ) then
    raise exception 'Multiple Namayumba or Naddangira parishes found; resolve duplicates before applying corrections';
  end if;
end $$;

-- UGX 30,000 monthly = UGX 360,000 for twelve months, independent of vicariate.
update public.parishes
set monthly_emitemwa_amount = 30000
where btrim(name) ~* '^(namayumba|naddangira)(\s+parish)?$'
  and monthly_emitemwa_amount is distinct from 30000;

update public.parishes
set name = regexp_replace(btrim(name), '^bugongo', 'Bugonga', 'i')
where btrim(name) ~* '^bugongo(\s+parish)?$';
