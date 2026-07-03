-- Phase 1: RLS-политики.
-- Правило из CLAUDE.md: контент приватного/платного сообщества видят только
-- члены (memberships), бесплатные открытые — все авторизованные. Писать
-- посты — члены, модерация (закреп, удаление чужого) — owner/admin.

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.post_categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.points_events enable row level security;
alter table public.subscriptions enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────
-- Профили видны всем авторизованным (имя/аватар нужны в постах, участниках
-- и т.д.), редактировать может только владелец профиля.

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── communities ─────────────────────────────────────────────────────────

create policy "communities_select" on public.communities
  for select to authenticated
  using (
    (is_private = false and price_monthly is null)
    or public.is_member(id)
  );

create policy "communities_insert_own" on public.communities
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy "communities_update_owner" on public.communities
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "communities_delete_owner" on public.communities
  for delete to authenticated
  using (owner_id = auth.uid());

-- ── memberships ─────────────────────────────────────────────────────────

create policy "memberships_select" on public.memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_member(community_id));

create policy "memberships_insert_self" on public.memberships
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "memberships_update_admin" on public.memberships
  for update to authenticated
  using (public.is_admin(community_id))
  with check (public.is_admin(community_id));

create policy "memberships_delete_self_or_admin" on public.memberships
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin(community_id));

-- ── post_categories ─────────────────────────────────────────────────────

create policy "post_categories_select" on public.post_categories
  for select to authenticated
  using (public.can_view_community(community_id));

create policy "post_categories_write_admin" on public.post_categories
  for all to authenticated
  using (public.is_admin(community_id))
  with check (public.is_admin(community_id));

-- ── posts ───────────────────────────────────────────────────────────────

create policy "posts_select" on public.posts
  for select to authenticated
  using (public.can_view_community(community_id));

create policy "posts_insert_member" on public.posts
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_member(community_id));

create policy "posts_update_author_or_admin" on public.posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin(community_id))
  with check (author_id = auth.uid() or public.is_admin(community_id));

create policy "posts_delete_author_or_admin" on public.posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin(community_id));

-- ── comments ────────────────────────────────────────────────────────────

create policy "comments_select" on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id and public.can_view_community(p.community_id)
    )
  );

create policy "comments_insert_member" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id and public.is_member(p.community_id)
    )
  );

create policy "comments_update_author" on public.comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "comments_delete_author_or_admin" on public.comments
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = comments.post_id and public.is_admin(p.community_id)
    )
  );

-- ── likes ───────────────────────────────────────────────────────────────

create policy "likes_select_authenticated" on public.likes
  for select to authenticated
  using (true);

create policy "likes_insert_own" on public.likes
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "likes_delete_own" on public.likes
  for delete to authenticated
  using (user_id = auth.uid());

-- ── courses ─────────────────────────────────────────────────────────────
-- Участники видят только опубликованные курсы, admin/owner — все (включая
-- черновики).

create policy "courses_select" on public.courses
  for select to authenticated
  using (
    (is_published and public.can_view_community(community_id))
    or public.is_admin(community_id)
  );

create policy "courses_write_admin" on public.courses
  for all to authenticated
  using (public.is_admin(community_id))
  with check (public.is_admin(community_id));

-- ── modules ─────────────────────────────────────────────────────────────

create policy "modules_select" on public.modules
  for select to authenticated
  using (
    exists (
      select 1 from public.courses co
      where co.id = modules.course_id
        and (
          (co.is_published and public.can_view_community(co.community_id))
          or public.is_admin(co.community_id)
        )
    )
  );

create policy "modules_write_admin" on public.modules
  for all to authenticated
  using (
    exists (
      select 1 from public.courses co
      where co.id = modules.course_id and public.is_admin(co.community_id)
    )
  )
  with check (
    exists (
      select 1 from public.courses co
      where co.id = modules.course_id and public.is_admin(co.community_id)
    )
  );

-- ── lessons ─────────────────────────────────────────────────────────────

create policy "lessons_select" on public.lessons
  for select to authenticated
  using (
    exists (
      select 1 from public.modules mo
      join public.courses co on co.id = mo.course_id
      where mo.id = lessons.module_id
        and (
          (co.is_published and public.can_view_community(co.community_id))
          or public.is_admin(co.community_id)
        )
    )
  );

create policy "lessons_write_admin" on public.lessons
  for all to authenticated
  using (
    exists (
      select 1 from public.modules mo
      join public.courses co on co.id = mo.course_id
      where mo.id = lessons.module_id and public.is_admin(co.community_id)
    )
  )
  with check (
    exists (
      select 1 from public.modules mo
      join public.courses co on co.id = mo.course_id
      where mo.id = lessons.module_id and public.is_admin(co.community_id)
    )
  );

-- ── lesson_progress ─────────────────────────────────────────────────────
-- Приватный прогресс пользователя, виден и редактируется только им самим.

create policy "lesson_progress_select_own" on public.lesson_progress
  for select to authenticated
  using (user_id = auth.uid());

create policy "lesson_progress_insert_own" on public.lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "lesson_progress_delete_own" on public.lesson_progress
  for delete to authenticated
  using (user_id = auth.uid());

-- ── points_events ───────────────────────────────────────────────────────
-- Неизменяемый лог: только select/insert, без update/delete-политик.

create policy "points_events_select" on public.points_events
  for select to authenticated
  using (
    exists (
      select 1 from public.memberships m
      where m.id = points_events.membership_id
        and (m.user_id = auth.uid() or public.is_admin(m.community_id))
    )
  );

create policy "points_events_insert_own" on public.points_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.memberships m
      where m.id = points_events.membership_id and m.user_id = auth.uid()
    )
  );

-- ── subscriptions ───────────────────────────────────────────────────────

create policy "subscriptions_select" on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin(community_id));

create policy "subscriptions_insert_own" on public.subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "subscriptions_update_own_or_admin" on public.subscriptions
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin(community_id))
  with check (user_id = auth.uid() or public.is_admin(community_id));
