-- Creator dashboard + image uploads: community avatar column, post_images
-- table, and Storage buckets for community/post photos (the existing
-- `avatars` bucket from 0006 is untouched and reused as-is for profile
-- photos).

-- ── communities.avatar_url ────────────────────────────────────────────
-- Separate from cover_url: cover is the wide banner, avatar is the square
-- logo-style thumbnail shown in the catalog card, community header, and
-- checkout.

alter table public.communities add column avatar_url text;

-- ── post_images ─────────────────────────────────────────────────────────
-- Up to 4 photos per post, uploaded to Storage before the post row exists
-- (path is keyed by user, not post_id — see the post-images bucket policy
-- below), then linked here once the post is created.

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create index post_images_post_id_idx on public.post_images (post_id);

alter table public.post_images enable row level security;

create policy "post_images_select" on public.post_images
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_images.post_id and public.can_view_community(p.community_id)
    )
  );

create policy "post_images_insert_author" on public.post_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_images.post_id and p.author_id = auth.uid()
    )
  );

create policy "post_images_delete_author_or_admin" on public.post_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_images.post_id
        and (p.author_id = auth.uid() or public.is_admin(p.community_id))
    )
  );

-- ── Storage buckets ───────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('community-images', 'community-images', true),
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- community-images: path convention {community_id}/avatar.{ext} and
-- {community_id}/cover.{ext} — only the community's owner/admin may write,
-- reusing the is_admin() helper from 0002_functions_and_triggers.sql.

create policy "community_images_public_read" on storage.objects
  for select
  using (bucket_id = 'community-images');

create policy "community_images_insert_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-images'
    and public.is_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "community_images_update_admin" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'community-images'
    and public.is_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "community_images_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'community-images'
    and public.is_admin(((storage.foldername(name))[1])::uuid)
  );

-- post-images: path convention {user_id}/{timestamp}_{index}.{ext} — same
-- own-folder-only shape as the avatars bucket policy in 0006, since images
-- are uploaded before the post row (and its id) exists.

create policy "post_images_bucket_public_read" on storage.objects
  for select
  using (bucket_id = 'post-images');

create policy "post_images_bucket_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_images_bucket_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
