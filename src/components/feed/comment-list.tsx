"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/feed/level-badge";
import { createClient } from "@/lib/supabase/client";
import { createComment, toggleLike } from "@/app/c/[slug]/actions";
import { formatRelativeTime } from "@/lib/relative-time";
import { levelFromPoints } from "@/lib/points";
import { cn } from "@/lib/utils";
import type { FeedComment } from "@/components/feed/types";

interface CommentListProps {
  postId: string;
  communityId: string;
  onCommentCreated: () => void;
}

export function CommentList({ postId, communityId, onCommentCreated }: CommentListProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [pointsByAuthor, setPointsByAuthor] = useState<Map<string, number>>(new Map());
  const [likedByMe, setLikedByMe] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: rows } = await supabase
        .from("comments")
        .select("*, profiles(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      const list = (rows ?? []) as unknown as FeedComment[];
      if (cancelled) return;
      setComments(list);

      const authorIds = Array.from(new Set(list.map((c) => c.author_id)));
      if (authorIds.length > 0) {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("user_id, points")
          .eq("community_id", communityId)
          .in("user_id", authorIds);
        if (!cancelled && memberships) {
          setPointsByAuthor(new Map(memberships.map((m) => [m.user_id, m.points])));
        }
      }

      const commentIds = list.map((c) => c.id);
      if (commentIds.length > 0) {
        const { data: likes } = await supabase
          .from("likes")
          .select("user_id, target_id")
          .eq("target_type", "comment")
          .in("target_id", commentIds);
        if (!cancelled && likes) {
          const counts = new Map<string, number>();
          for (const l of likes) counts.set(l.target_id, (counts.get(l.target_id) ?? 0) + 1);
          setLikeCounts(counts);

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            setLikedByMe(new Set(likes.filter((l) => l.user_id === user.id).map((l) => l.target_id)));
          }
        }
      }

      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.author_id)
            .single();
          setComments((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            return [...prev, { ...(payload.new as FeedComment), profiles: profile ?? null }];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function submitComment(content: string, parentId: string | null) {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const { comment, pointsAwarded } = await createComment(postId, communityId, {
        content: content.trim(),
        parentId,
      });
      setComments((prev) =>
        prev.some((c) => c.id === comment.id) ? prev : [...prev, comment as unknown as FeedComment]
      );
      onCommentCreated();
      toast.success(`+${pointsAwarded} очко!`);
      if (parentId) {
        setReplyingTo(null);
        setReplyText("");
      } else {
        setNewComment("");
      }
    } catch {
      toast.error("Не удалось отправить комментарий.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeComment(commentId: string, authorId: string) {
    const wasLiked = likedByMe.has(commentId);
    setLikedByMe((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
    setLikeCounts((prev) => {
      const next = new Map(prev);
      next.set(commentId, (next.get(commentId) ?? 0) + (wasLiked ? -1 : 1));
      return next;
    });
    try {
      await toggleLike("comment", commentId, authorId, communityId);
    } catch {
      toast.error("Не удалось поставить лайк.");
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, FeedComment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      repliesByParent.set(c.parent_id, [...(repliesByParent.get(c.parent_id) ?? []), c]);
    }
  }

  function CommentRow({ comment, isReply }: { comment: FeedComment; isReply: boolean }) {
    const author = comment.profiles;
    const name = author?.full_name || "Без имени";
    const level = levelFromPoints(pointsByAuthor.get(comment.author_id) ?? 0);
    const liked = likedByMe.has(comment.id);
    const count = likeCounts.get(comment.id) ?? 0;

    return (
      <div className={cn("flex gap-2.5", isReply && "ml-10")}>
        <Link href={`/u/${comment.author_id}`}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={author?.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-secondary px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Link href={`/u/${comment.author_id}`} className="text-sm font-semibold hover:underline">
                {name}
              </Link>
              <LevelBadge level={level} />
            </div>
            <p className="text-sm text-foreground/90">{comment.content}</p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-1 text-xs text-muted-foreground">
            <span>{formatRelativeTime(comment.created_at)}</span>
            <button
              type="button"
              onClick={() => handleLikeComment(comment.id, comment.author_id)}
              className={cn("flex items-center gap-1 font-medium", liked && "text-primary")}
            >
              <Heart className={cn("size-3", liked && "fill-current")} />
              {count > 0 ? count : ""}
            </button>
            {!isReply && (
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="font-medium"
              >
                Ответить
              </button>
            )}
          </div>

          {!isReply && replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                rows={1}
                placeholder="Ваш ответ..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-9 resize-none"
              />
              <Button
                size="sm"
                disabled={submitting}
                onClick={() => submitComment(replyText, comment.id)}
              >
                Отправить
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-3">
      {loading ? (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </>
      ) : (
        topLevel.map((c) => (
          <div key={c.id} className="space-y-2">
            <CommentRow comment={c} isReply={false} />
            {(repliesByParent.get(c.id) ?? []).map((reply) => (
              <CommentRow key={reply.id} comment={reply} isReply />
            ))}
          </div>
        ))
      )}

      <div className="flex gap-2">
        <Textarea
          rows={1}
          placeholder="Напишите комментарий..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-9 resize-none"
        />
        <Button size="sm" disabled={submitting} onClick={() => submitComment(newComment, null)}>
          Отправить
        </Button>
      </div>
    </div>
  );
}
