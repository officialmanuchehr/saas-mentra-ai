"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { Composer } from "@/components/feed/composer";
import { CategoryFilter } from "@/components/feed/category-filter";
import { PostCard } from "@/components/feed/post-card";
import { WeeklySummaryButton } from "@/components/feed/weekly-summary-button";
import { createClient } from "@/lib/supabase/client";
import type { FeedCategory, FeedPost } from "@/components/feed/types";

interface FeedClientProps {
  communityId: string;
  communityName: string;
  categories: FeedCategory[];
  initialPosts: FeedPost[];
  pointsByAuthor: Record<string, number>;
  likedPostIds: string[];
  myAvatarUrl: string | null;
  myName: string;
  isAdmin: boolean;
}

export function FeedClient({
  communityId,
  communityName,
  categories,
  initialPosts,
  pointsByAuthor,
  likedPostIds,
  myAvatarUrl,
  myName,
  isAdmin,
}: FeedClientProps) {
  const supabase = createClient();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);

  useEffect(() => {
    const channel = supabase
      .channel(`posts-${communityId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: `community_id=eq.${communityId}` },
        async (payload) => {
          const [{ data: profile }, { data: images }] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", payload.new.author_id)
              .single(),
            supabase
              .from("post_images")
              .select("id, url, sort_order")
              .eq("post_id", payload.new.id)
              .order("sort_order"),
          ]);
          setPosts((prev) => {
            if (prev.some((p) => p.id === payload.new.id)) return prev;
            return [
              { ...(payload.new as FeedPost), profiles: profile ?? null, post_images: images ?? [] },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const visiblePosts = useMemo(() => {
    const filtered = activeCategory
      ? posts.filter((p) => p.category_id === activeCategory)
      : posts;
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [posts, activeCategory]);

  function handleCreated(post: FeedPost) {
    setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
  }

  return (
    <div className="space-y-5">
      <Composer
        communityId={communityId}
        categories={categories}
        myAvatarUrl={myAvatarUrl}
        myName={myName}
        onCreated={handleCreated}
      />

      {isAdmin && (
        <WeeklySummaryButton
          communityId={communityId}
          communityName={communityName}
          onCreated={handleCreated}
        />
      )}

      {categories.length > 0 && (
        <CategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
      )}

      {visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card py-16 text-center shadow-sm">
          <MessageSquareDashed className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Пока нет постов в этой категории</p>
          <p className="text-sm text-muted-foreground">Станьте первым, кто напишет что-нибудь.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              communityId={communityId}
              authorPoints={pointsByAuthor[post.author_id] ?? 0}
              category={post.category_id ? categoryById.get(post.category_id) ?? null : null}
              likedByMe={likedSet.has(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
