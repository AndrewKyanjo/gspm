create schema if not exists app;

create or replace function app.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_assignments ua
      on ua.user_id = p.id
    where p.id = auth.uid()
      and p.account_status = 'approved'
      and p.is_active = true
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin')
  );
$$;

create or replace function app.assert_current_user_is_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app.current_user_is_admin() then
    raise exception 'Only Archdiocese admins can review registration requests';
  end if;
end;
$$;

create or replace function app.validate_role_level_pair(
  p_role public.app_role,
  p_level public.hierarchy_level
)
returns boolean
language sql
immutable
as $$
  select case
    when p_level = 'archdiocese' then p_role in ('super_admin', 'archdiocese_admin')
    when p_level = 'vicariate' then p_role in ('vicariate_head', 'vicariate_staff')
    when p_level = 'deanery' then p_role in ('deanery_head', 'deanery_staff')
    when p_level = 'parish' then p_role in ('parish_head', 'parish_data_entry')
    else false
  end;
$$;

alter table public.registration_requests enable row level security;

drop policy if exists registration_requests_self_select on public.registration_requests;
create policy registration_requests_self_select
on public.registration_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists registration_requests_self_insert on public.registration_requests;
create policy registration_requests_self_insert
on public.registration_requests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists registration_requests_admin_select on public.registration_requests;
create policy registration_requests_admin_select
on public.registration_requests
for select
to authenticated
using (app.current_user_is_admin());

drop function if exists app.approve_registration_request(
  uuid,
  public.app_role,
  public.hierarchy_level,
  uuid,
  uuid,
  uuid,
  uuid,
  text
);

create or replace function app.approve_registration_request(
  p_request_id uuid,
  p_role public.app_role,
  p_level public.hierarchy_level,
  p_archdiocese_id uuid,
  p_vicariate_id uuid,
  p_deanery_id uuid,
  p_parish_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.registration_requests%rowtype;
begin
  perform app.assert_current_user_is_admin();

  if not app.validate_role_level_pair(p_role, p_level) then
    raise exception 'Invalid role and hierarchy level combination';
  end if;

  select *
  into v_request
  from public.registration_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Registration request not found';
  end if;

  if v_request.approval_status <> 'pending' then
    raise exception 'Only pending requests can be approved';
  end if;

  update public.user_assignments
  set is_active = false,
      is_primary = false
  where user_id = v_request.user_id
    and is_active = true
    and is_primary = true;

  insert into public.user_assignments (
    user_id,
    role,
    level,
    archdiocese_id,
    vicariate_id,
    deanery_id,
    parish_id,
    is_primary,
    is_active
  )
  values (
    v_request.user_id,
    p_role,
    p_level,
    p_archdiocese_id,
    p_vicariate_id,
    p_deanery_id,
    p_parish_id,
    true,
    true
  );

  update public.registration_requests
  set approval_status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      review_notes = p_review_notes
  where id = p_request_id;

  update public.profiles
  set account_status = 'approved',
      is_active = true
  where id = v_request.user_id;
end;
$$;

drop function if exists app.reject_registration_request(
  uuid,
  text
);

create or replace function app.reject_registration_request(
  p_request_id uuid,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.registration_requests%rowtype;
begin
  perform app.assert_current_user_is_admin();

  select *
  into v_request
  from public.registration_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Registration request not found';
  end if;

  if v_request.approval_status <> 'pending' then
    raise exception 'Only pending requests can be rejected';
  end if;

  update public.registration_requests
  set approval_status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = timezone('utc', now()),
      review_notes = p_review_notes
  where id = p_request_id;

  update public.profiles
  set account_status = 'rejected',
      is_active = false
  where id = v_request.user_id;
end;
$$;

drop function if exists public.approve_registration_request(
  uuid,
  public.app_role,
  public.hierarchy_level,
  uuid,
  uuid,
  uuid,
  uuid,
  text
);

create or replace function public.approve_registration_request(
  p_request_id uuid,
  p_role public.app_role,
  p_level public.hierarchy_level,
  p_archdiocese_id uuid,
  p_vicariate_id uuid,
  p_deanery_id uuid,
  p_parish_id uuid,
  p_review_notes text default null
)
returns void
language sql
security definer
set search_path = public, app
as $$
  select app.approve_registration_request(
    p_request_id,
    p_role,
    p_level,
    p_archdiocese_id,
    p_vicariate_id,
    p_deanery_id,
    p_parish_id,
    p_review_notes
  );
$$;

drop function if exists public.reject_registration_request(
  uuid,
  text
);

create or replace function public.reject_registration_request(
  p_request_id uuid,
  p_review_notes text default null
)
returns void
language sql
security definer
set search_path = public, app
as $$
  select app.reject_registration_request(p_request_id, p_review_notes);
$$;

revoke all on function app.current_user_is_admin() from public;
revoke all on function app.assert_current_user_is_admin() from public;
revoke all on function app.validate_role_level_pair(public.app_role, public.hierarchy_level) from public;
revoke all on function app.approve_registration_request(uuid, public.app_role, public.hierarchy_level, uuid, uuid, uuid, uuid, text) from public;
revoke all on function app.reject_registration_request(uuid, text) from public;

grant usage on schema app to authenticated;
grant execute on function app.current_user_is_admin() to authenticated;
grant execute on function public.approve_registration_request(uuid, public.app_role, public.hierarchy_level, uuid, uuid, uuid, uuid, text) to authenticated;
grant execute on function public.reject_registration_request(uuid, text) to authenticated;
