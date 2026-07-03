-- Phase 1: базовая схема Mentra AI (сообщества, посты, курсы, геймификация, подписки)

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Перечисления ────────────────────────────────────────────────────────

create type public.membership_role as enum ('owner', 'admin', 'member');
create type public.like_target_type as enum ('post', 'comment');
create type public.points_event_type as enum (
  'post_created',
  'comment_created',
  'like_received',
  'lesson_completed',
  'daily_login'
);
create type public.subscription_status as enum ('active', 'canceled', 'past_due');

-- ── profiles ────────────────────────────────────────────────────────────
-- Одна запись на пользователя auth.users, создаётся триггером handle_new_user.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- ── communities ─────────────────────────────────────────────────────────

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_url text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  is_private boolean not null default false,
  price_monthly numeric(10, 2), -- null = бесплатное сообщество
  currency text not null default 'RUB',
  created_at timestamptz not null default now()
);

create index communities_owner_id_idx on public.communities (owner_id);

-- ── memberships ─────────────────────────────────────────────────────────

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'member',
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_community_id_idx on public.memberships (community_id);

-- ── post_categories ─────────────────────────────────────────────────────

create table public.post_categories (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  name text not null,
  emoji text,
  sort_order integer not null default 0
);

create index post_categories_community_id_idx on public.post_categories (community_id);

-- ── posts ───────────────────────────────────────────────────────────────

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.post_categories (id) on delete set null,
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index posts_community_id_created_at_idx on public.posts (community_id, created_at desc);
create index posts_author_id_idx on public.posts (author_id);
create index posts_category_id_idx on public.posts (category_id);

-- ── comments ────────────────────────────────────────────────────────────

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);
create index comments_parent_id_idx on public.comments (parent_id);

-- ── likes ───────────────────────────────────────────────────────────────
-- Полиморфная цель (post|comment) — без FK на target_id, целостность
-- обеспечивается на уровне приложения.

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.like_target_type not null,
  target_id uuid not null,
  unique (user_id, target_type, target_id)
);

create index likes_target_idx on public.likes (target_type, target_id);

-- ── courses / modules / lessons ────────────────────────────────────────

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false
);

create index courses_community_id_idx on public.courses (community_id);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0
);

create index modules_course_id_idx on public.modules (course_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  video_url text,
  content text,
  duration_min integer,
  sort_order integer not null default 0
);

create index lessons_module_id_idx on public.lessons (module_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);

-- ── points_events ───────────────────────────────────────────────────────
-- Лог начислений очков. INSERT в эту таблицу обновляет memberships.points
-- (см. триггер в 0002_functions_and_triggers.sql).

create table public.points_events (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  event_type public.points_event_type not null,
  points integer not null,
  created_at timestamptz not null default now()
);

create index points_events_membership_id_idx on public.points_events (membership_id);

-- ── subscriptions ───────────────────────────────────────────────────────

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.subscription_status not null,
  amount numeric(10, 2) not null,
  currency text not null default 'RUB',
  started_at timestamptz not null default now(),
  expires_at timestamptz
);

create index subscriptions_community_id_idx on public.subscriptions (community_id);
create index subscriptions_user_id_idx on public.subscriptions (user_id);
