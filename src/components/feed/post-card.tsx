"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Pin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LevelBadge } from "@/components/feed/level-badge";
import { CommentList } from "@/components/feed/comment-list";
import { ImageLightbox } from "@/components/feed/image-lightbox";
import { formatRelativeTime } from "@/lib/relative-time";
import { levelFromPoints } from "@/lib/points";
import { toggleLike } from "@/app/c/[slug]/actions";
import { cn } from "@/lib/utils";
import type { FeedCategory, FeedPost } from "@/components/feed/types";

const CLAMP_THRESHOLD = 220;

interface PostCardProps {
  post: FeedPost;
  communityId: string;
  authorPoints: number;
  category: FeedCategory | null;
  likedByMe: boolean;
}

export function PostCard({ post, communityId, authorPoints, category, likedByMe }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liked, setLiked] = useState(likedByMe);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = post.post_images ?? [];

  const author = post.profiles;
  const authorName = author?.full_name || "Без имени";
  const isBot = authorName === "Mentra AI";
  const level = levelFromPoints(authorPoints);
  const isLong = post.content.length > CLAMP_THRESHOLD;

  async function handleLike() {
    // оптимистичное обновление UI
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      await toggleLike("post", post.id, post.author_id, communityId);
    } catch {
      // откатываем при ошибке
      setLiked((prev) => !prev);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
      toast.error("Не удалось поставить лайк.");
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-5">
        {post.is_pinned && (
          <Badge variant="light" className="gap-1">
            <Pin className="size-3" /> Закреплено
          </Badge>
        )}

        <Link href={`/u/${post.author_id}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url ?? undefined} alt={authorName} />
            <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold hover:underline">{authorName}</span>
              {isBot ? (
                <Badge variant="light" className="gap-1">
                  <Sparkles className="size-3" /> AI
                </Badge>
              ) : (
                <LevelBadge level={level} />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(post.created_at)}
              {category && ` · ${category.emoji ?? ""} ${category.name}`}
            </p>
          </div>
        </Link>

        <div>
          <h3 className="font-bold leading-snug">{post.title}</h3>
          <p className={cn("whitespace-pre-wrap text-sm text-foreground/90", !expanded && isLong && "line-clamp-4")}>
            {post.content}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm font-medium text-primary hover:underline"
            >
              {expanded ? "Свернуть" : "Показать ещё"}
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div
            className={cn(
              "overflow-hidden rounded-xl",
              images.length > 1 && "grid grid-cols-2 gap-1"
            )}
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className={cn(
                  "relative block w-full overflow-hidden",
                  images.length === 1 ? "aspect-video" : "aspect-square"
                )}
              >
                <Image src={image.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("size-4", liked && "fill-current")} />
            {likesCount}
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            {commentsCount}
          </button>
        </div>

        {commentsOpen && (
          <CommentList
            postId={post.id}
            communityId={communityId}
            onCommentCreated={() => setCommentsCount((c) => c + 1)}
          />
        )}
      </CardContent>
    </Card>
  );
}
