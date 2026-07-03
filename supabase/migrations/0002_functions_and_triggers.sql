-- Phase 1: функции и триггеры (профили, очки, счётчики, вспомогательные
-- функции для RLS-политик).

-- ── level_from_points ──────────────────────────────────────────────────
-- Уровень как функция от очков, не хранится в таблице.
-- Пороги: L1=0, L2=5, L3=20, L4=65, L5=155, L6=515, L7=2015, L8=8015, L9=33015.

create or replace function public.level_from_points(points integer)
returns integer
language sql
immutable
as $$
  select case
    when points >= 33015 then 9
    when points >= 8015 then 8
    when points >= 2015 then 7
    when points >= 515 then 6
    when points >= 155 then 5
    when points >= 65 then 4
    when points >= 20 then 3
    when points >= 5 then 2
    else 1
  end;
$$;

-- ── handle_new_user ────────────────────────────────────────────────────
-- Создаёт запись profiles при регистрации пользователя в auth.users.
-- security definer нужен, т.к. auth.users вне досягаемости обычных RLS-политик.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── apply_points_event ─────────────────────────────────────────────────
-- INSERT в points_events -> обновляет memberships.points.

create or replace function public.apply_points_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.memberships
  set points = points + new.points
  where id = new.membership_id;
  return new;
end;
$$;

create trigger on_points_event_created
  after insert on public.points_events
  for each row execute procedure public.apply_points_event();

-- ── likes_count / comments_count на posts ────────────────────────────

create or replace function public.apply_like_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.target_type = 'post' then
      update public.posts set likes_count = likes_count + 1 where id = new.target_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.target_type = 'post' then
      update public.posts set likes_count = likes_count - 1 where id = old.target_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.apply_like_change();

create or replace function public.apply_comment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.apply_comment_change();

-- ── вспомогательные функции для RLS ──────────────────────────────────
-- security definer + фиксированный search_path, чтобы обходить RLS самих
-- memberships/communities и не вызывать рекурсию политик при использовании
-- этих функций внутри `using`/`with check`.

create or replace function public.is_member(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where community_id = p_community_id and user_id = p_user_id
  );
$$;

create or replace function public.is_admin(p_community_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where community_id = p_community_id
      and user_id = p_user_id
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_open_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.communities
    where id = p_community_id and is_private = false and price_monthly is null
  );
$$;

create or replace function public.can_view_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_member(p_community_id) or public.is_open_community(p_community_id);
$$;
