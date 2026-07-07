-- Phase 6: уведомления (лайки и комментарии к своим постам/комментариям).
-- Таблица + триггеры-генераторы + RLS + realtime, чтобы бейдж в топбаре
-- обновлялся без перезагрузки страницы.

create type public.notification_type as enum (
  'comment_on_post',
  'reply_to_comment',
  'like_post',
  'like_comment'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade, -- получатель
  actor_id uuid not null references public.profiles (id) on delete cascade, -- кто вызвал событие
  type public.notification_type not null,
  community_id uuid not null references public.communities (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications (user_id) where not is_read;

-- ── генерация уведомлений о комментариях ─────────────────────────────────
-- Комментарий к посту -> уведомляем автора поста.
-- Ответ на комментарий -> уведомляем автора родительского комментария
-- (а не автора поста, чтобы не дублировать одно событие двумя уведомлениями).

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author_id uuid;
  v_community_id uuid;
  v_parent_author_id uuid;
begin
  select author_id, community_id into v_post_author_id, v_community_id
  from public.posts where id = new.post_id;

  if new.parent_id is not null then
    select author_id into v_parent_author_id
    from public.comments where id = new.parent_id;

    if v_parent_author_id is not null and v_parent_author_id != new.author_id then
      insert into public.notifications (user_id, actor_id, type, community_id, post_id, comment_id)
      values (v_parent_author_id, new.author_id, 'reply_to_comment', v_community_id, new.post_id, new.id);
    end if;
  else
    if v_post_author_id is not null and v_post_author_id != new.author_id then
      insert into public.notifications (user_id, actor_id, type, community_id, post_id, comment_id)
      values (v_post_author_id, new.author_id, 'comment_on_post', v_community_id, new.post_id, new.id);
    end if;
  end if;

  return new;
end;
$$;

create trigger on_comment_notify
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

-- ── генерация уведомлений о лайках ────────────────────────────────────────

create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_community_id uuid;
  v_post_id uuid;
  v_comment_id uuid;
begin
  if new.target_type = 'post' then
    select author_id, community_id, id into v_owner_id, v_community_id, v_post_id
    from public.posts where id = new.target_id;

    if v_owner_id is not null and v_owner_id != new.user_id then
      insert into public.notifications (user_id, actor_id, type, community_id, post_id)
      values (v_owner_id, new.user_id, 'like_post', v_community_id, v_post_id);
    end if;
  else
    select c.author_id, p.community_id, c.post_id, c.id into v_owner_id, v_community_id, v_post_id, v_comment_id
    from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = new.target_id;

    if v_owner_id is not null and v_owner_id != new.user_id then
      insert into public.notifications (user_id, actor_id, type, community_id, post_id, comment_id)
      values (v_owner_id, new.user_id, 'like_comment', v_community_id, v_post_id, v_comment_id);
    end if;
  end if;

  return new;
end;
$$;

create trigger on_like_notify
  after insert on public.likes
  for each row execute procedure public.notify_on_like();

-- ── RLS ────────────────────────────────────────────────────────────────
-- Каждый видит и помечает прочитанными только свои уведомления. INSERT
-- выполняется только через security definer триггеры выше, отдельная
-- политика на insert для пользователей не нужна.

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── realtime ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.notifications;
