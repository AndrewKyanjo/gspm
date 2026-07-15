-- ============================================================================
-- Migration: Ministry Feed & Notifications (TODO.md §4)
-- Date:       2026-07-10
-- Feature:    Tweet-style Archdiocese announcement channel + notification bell
--
-- Adds:
--   1. feed_posts table — root announcements + flat replies
--   2. notification_type enum + notifications table — per-user notification rows
--   3. RLS policies for both tables
--   4. Trigger: auto-create notifications when a new feed post is published
--   5. Helper: app.can_post_announcement() — gates the composer
--   6. Helper: app.get_unread_notification_count() — called by the bell icon
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Feed posts table
-- ----------------------------------------------------------------------------
create table if not exists public.feed_posts (
  id                  uuid primary key default gen_random_uuid(),
  parent_post_id      uuid references public.feed_posts(id) on delete cascade,
  author_id           uuid not null references public.profiles(id),
  content             text not null check (char_length(content) >= 1 and char_length(content) <= 2000),
  archdiocese_id      uuid not null references public.archdioceses(id),
  is_pinned           boolean not null default false,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  deleted_at          timestamptz
);

-- Prevent replies to replies (flat two-tier model)
create or replace function app.check_feed_post_depth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_post_id is not null then
    if exists (
      select 1 from public.feed_posts
      where id = new.parent_post_id and parent_post_id is not null
    ) then
      raise exception 'Replies to replies are not allowed. Reply directly to the root post.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_feed_post_depth on public.feed_posts;
create trigger trg_check_feed_post_depth
  before insert on public.feed_posts
  for each row execute function app.check_feed_post_depth();

-- ----------------------------------------------------------------------------
-- 2. Feed posts RLS
-- ----------------------------------------------------------------------------
alter table public.feed_posts enable row level security;

-- Any authenticated approved user can see non-deleted posts
drop policy if exists feed_posts_select on public.feed_posts;
create policy feed_posts_select
on public.feed_posts
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'approved'
      and p.is_active = true
  )
);

-- Only admins can create root announcements
drop policy if exists feed_posts_insert_root on public.feed_posts;
create policy feed_posts_insert_root
on public.feed_posts
for insert
to authenticated
with check (
  parent_post_id is null
  and exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin')
  )
);

-- Any approved user can reply to a root post
drop policy if exists feed_posts_insert_reply on public.feed_posts;
create policy feed_posts_insert_reply
on public.feed_posts
for insert
to authenticated
with check (
  parent_post_id is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'approved'
      and p.is_active = true
  )
);

-- Author or admin can soft-delete
drop policy if exists feed_posts_update on public.feed_posts;
create policy feed_posts_update
on public.feed_posts
for update
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin')
  )
);

-- ----------------------------------------------------------------------------
-- 3. Notification type + notifications table
-- ----------------------------------------------------------------------------
do $$
begin
  create type public.notification_type as enum (
    'task_assigned', 'task_due_soon', 'task_overdue',
    'report_period_open', 'report_overdue',
    'feed_post_new', 'feed_reply_new'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  recipient_id          uuid not null references public.profiles(id),
  type                  public.notification_type not null,
  title                 text not null,
  body                  text,
  link_url              text,
  related_task_id       uuid,
  related_feed_post_id  uuid references public.feed_posts(id),
  read_at               timestamptz,
  emailed_at            timestamptz,
  created_at            timestamptz not null default timezone('utc', now())
);

alter table public.notifications enable row level security;

-- Users can only see their own notifications
drop policy if exists notifications_select on public.notifications;
create policy notifications_select
on public.notifications
for select
to authenticated
using (recipient_id = auth.uid());

-- Users can mark their own notifications as read
drop policy if exists notifications_update on public.notifications;
create policy notifications_update
on public.notifications
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- No client-side INSERT — notifications are created by triggers / RPCs only.
-- (No INSERT policy — this is intentional.)

-- ----------------------------------------------------------------------------
-- 4. Triggers — auto-create notifications on feed posts
-- ----------------------------------------------------------------------------

-- When an admin creates a root post, notify all approved users in the
-- archdiocese (broadcast model for v1 — matches the TODO.md design).
create or replace function app.notify_on_feed_root_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_post_id is null and new.deleted_at is null then
    insert into public.notifications (recipient_id, type, title, body, link_url, related_feed_post_id)
    select
      p.id,
      'feed_post_new',
      'New announcement from the Archdiocese',
      left(new.content, 120),
      '/dashboard/feed',
      new.id
    from public.profiles p
    where p.account_status = 'approved'
      and p.is_active = true
      and p.id <> new.author_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_feed_root_post on public.feed_posts;
create trigger trg_notify_on_feed_root_post
  after insert on public.feed_posts
  for each row execute function app.notify_on_feed_root_post();

-- When someone replies, notify the original post author
create or replace function app.notify_on_feed_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_root_author uuid;
begin
  if new.parent_post_id is not null then
    select author_id into v_root_author
    from public.feed_posts
    where id = new.parent_post_id;

    if v_root_author is not null and v_root_author <> new.author_id then
      insert into public.notifications (recipient_id, type, title, body, link_url, related_feed_post_id)
      values (
        v_root_author,
        'feed_reply_new',
        'New reply to your announcement',
        left(new.content, 120),
        '/dashboard/feed',
        new.parent_post_id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_feed_reply on public.feed_posts;
create trigger trg_notify_on_feed_reply
  after insert on public.feed_posts
  for each row execute function app.notify_on_feed_reply();

-- ----------------------------------------------------------------------------
-- 5. Permission helpers
-- ----------------------------------------------------------------------------
create or replace function app.can_post_announcement()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_assignments ua
    where ua.user_id = auth.uid()
      and ua.is_active = true
      and ua.is_primary = true
      and ua.role in ('super_admin', 'archdiocese_admin')
  );
$$;

revoke all on function app.can_post_announcement() from public;
grant execute on function app.can_post_announcement() to authenticated;

create or replace function app.get_unread_notification_count(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.notifications
  where recipient_id = p_user_id and read_at is null;
$$;

revoke all on function app.get_unread_notification_count(uuid) from public;
grant execute on function app.get_unread_notification_count(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------------------
create index if not exists idx_feed_posts_archdiocese
  on public.feed_posts(archdiocese_id, created_at desc)
  where deleted_at is null and parent_post_id is null;

create index if not exists idx_feed_posts_replies
  on public.feed_posts(parent_post_id, created_at)
  where deleted_at is null and parent_post_id is not null;

create index if not exists idx_notifications_recipient
  on public.notifications(recipient_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications(recipient_id, created_at desc)
  where read_at is null;
