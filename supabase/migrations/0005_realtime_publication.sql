-- Phase 3: включаем Supabase Realtime для ленты сообщества.
-- Без явного добавления в publication таблица не шлёт postgres_changes,
-- даже если Realtime включён в проекте в целом. RLS продолжает применяться:
-- клиент получит только те события, которые ему разрешено видеть.

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
