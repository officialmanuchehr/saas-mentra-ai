-- Phase 2: поддержка каталога сообществ (Discovery).
--
-- 1) member_count — денормализованный счётчик участников на communities,
--    по аналогии с posts.likes_count/comments_count из Phase 1. Нужен,
--    чтобы показывать число участников на публичной странице каталога без
--    доступа к RLS-защищённой таблице memberships (её напрямую видеть
--    может не любой посетитель).
-- 2) Каталог сообществ (name/description/cover/price/member_count) должен
--    быть виден всем, включая неавторизованных посетителей, если
--    сообщество не приватное — это витрина для привлечения новых
--    участников, а не защищённый контент. Содержимое сообщества (посты,
--    курсы) остаётся закрытым для участников, как и было.

alter table public.communities add column member_count integer not null default 0;

create or replace function public.apply_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.communities set member_count = member_count - 1 where id = old.community_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_membership_change
  after insert or delete on public.memberships
  for each row execute procedure public.apply_membership_change();

-- Заменяем select-политику: каталог публичный для не-приватных сообществ.
drop policy "communities_select" on public.communities;

create policy "communities_select" on public.communities
  for select
  using (is_private = false or public.is_member(id));
