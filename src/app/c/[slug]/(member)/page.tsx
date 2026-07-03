import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedClient } from "@/components/feed/feed-client";
import { LevelProgress } from "@/components/shared/level-progress";
import { HowToEarnPoints } from "@/components/leaderboard/how-to-earn-points";
import type { FeedPost } from "@/components/feed/types";

export default async function CommunityFeedPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/about`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, name")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const [{ data: myMembership }, { data: myProfile }, { data: categories }, { data: posts }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("id, points, role")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
      supabase
        .from("post_categories")
        .select("id, name, emoji")
        .eq("community_id", community.id)
        .order("sort_order"),
      supabase
        .from("posts")
        .select("*, profiles(full_name, avatar_url), post_images(id, url, sort_order)")
        .eq("community_id", community.id)
        .order("created_at", { ascending: false })
        .order("sort_order", { foreignTable: "post_images" }),
      supabase.from("memberships").select("user_id, points").eq("community_id", community.id),
    ]);

  if (!myMembership) {
    redirect(`/c/${params.slug}/about`);
  }

  const postList = (posts ?? []) as unknown as FeedPost[];
  const postIds = postList.map((p) => p.id);

  const { data: myLikes } =
    postIds.length > 0
      ? await supabase
          .from("likes")
          .select("target_id")
          .eq("user_id", user.id)
          .eq("target_type", "post")
          .in("target_id", postIds)
      : { data: [] };

  const pointsByAuthor = Object.fromEntries((memberships ?? []).map((m) => [m.user_id, m.points]));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <FeedClient
        communityId={community.id}
        communityName={community.name}
        categories={categories ?? []}
        initialPosts={postList}
        pointsByAuthor={pointsByAuthor}
        likedPostIds={(myLikes ?? []).map((l) => l.target_id)}
        myAvatarUrl={myProfile?.avatar_url ?? null}
        myName={myProfile?.full_name || user.email || "Вы"}
        isAdmin={myMembership.role === "owner" || myMembership.role === "admin"}
      />

      <aside className="space-y-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <LevelProgress points={myMembership.points} label="Ваш прогресс здесь" />
        </div>
        <HowToEarnPoints />
      </aside>
    </div>
  );
}
