-- Keep denormalized parish scope consistent when a parish changes hierarchy.
-- Installing this migration does not reparent or repair existing records.
-- Every update below runs inside the original parish update transaction.
begin;

create or replace function public.sync_parish_hierarchy_after_transfer()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  target_table record;
begin
  if tg_table_schema <> 'public' or tg_table_name <> 'parishes' or tg_op <> 'UPDATE' then
    raise exception 'This trigger is only valid for parish hierarchy updates';
  end if;

  if row(old.archdiocese_id, old.vicariate_id, old.deanery_id)
     is not distinct from row(new.archdiocese_id, new.vicariate_id, new.deanery_id) then
    return new;
  end if;

  -- Discover actual project tables, including user_assignments and financial
  -- records. Trust only database administration owners: a caller-created table
  -- must never cause its triggers to run with this function's privileges.
  -- Ignore partition children because their parent update covers their rows.
  for target_table in
    select namespace.nspname as schema_name, relation.relname as table_name
    from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and not relation.relispartition
      and relation.oid <> tg_relid
      and pg_catalog.pg_get_userbyid(relation.relowner) in ('postgres', 'supabase_admin')
      and (
        select count(*)
        from pg_catalog.pg_attribute as attribute
        where attribute.attrelid = relation.oid
          and attribute.attnum > 0
          and not attribute.attisdropped
          and attribute.attname in ('parish_id', 'archdiocese_id', 'vicariate_id', 'deanery_id')
      ) = 4
    -- Child validation triggers can look up their immediate parent's scope.
    order by case relation.relname when 'sub_parishes' then 0 when 'akabondos' then 1 else 2 end,
             relation.relname
  loop
    execute pg_catalog.format(
      'update %I.%I
       set archdiocese_id = $1, vicariate_id = $2, deanery_id = $3
       where parish_id = $4
         and row(archdiocese_id, vicariate_id, deanery_id)
             is distinct from row($1, $2, $3)',
      target_table.schema_name,
      target_table.table_name
    ) using new.archdiocese_id, new.vicariate_id, new.deanery_id, new.id;
  end loop;

  -- Pending access requests follow the parish to its new approving hierarchy.
  -- Reviewed requests keep the scope that was reviewed at the time.
  update public.registration_requests
  set requested_archdiocese_id = new.archdiocese_id,
      requested_vicariate_id = new.vicariate_id,
      requested_deanery_id = new.deanery_id
  where requested_parish_id = new.id
    and approval_status = 'pending'
    and row(requested_archdiocese_id, requested_vicariate_id, requested_deanery_id)
        is distinct from row(new.archdiocese_id, new.vicariate_id, new.deanery_id);

  return new;
end;
$function$;

revoke all on function public.sync_parish_hierarchy_after_transfer() from public, anon, authenticated;

drop trigger if exists parish_hierarchy_after_transfer on public.parishes;
create trigger parish_hierarchy_after_transfer
after update of archdiocese_id, vicariate_id, deanery_id on public.parishes
for each row
when (
  old.archdiocese_id is distinct from new.archdiocese_id
  or old.vicariate_id is distinct from new.vicariate_id
  or old.deanery_id is distinct from new.deanery_id
)
execute function public.sync_parish_hierarchy_after_transfer();

-- A narrow capability check for the server; it cannot execute caller SQL.
create or replace function public.parish_hierarchy_transfer_ready()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from pg_catalog.pg_trigger as parish_trigger
    where parish_trigger.tgrelid = 'public.parishes'::pg_catalog.regclass
      and parish_trigger.tgname = 'parish_hierarchy_after_transfer'
      and not parish_trigger.tgisinternal
      -- O = normal origin sessions; A = always. Replica-only is insufficient.
      and parish_trigger.tgenabled in ('O', 'A')
      -- 17 = row-level AFTER UPDATE trigger.
      and parish_trigger.tgtype = 17
      and parish_trigger.tgfoid = 'public.sync_parish_hierarchy_after_transfer()'::pg_catalog.regprocedure
  );
$function$;

revoke all on function public.parish_hierarchy_transfer_ready() from public, anon, authenticated;
grant execute on function public.parish_hierarchy_transfer_ready() to service_role;

notify pgrst, 'reload schema';

commit;
