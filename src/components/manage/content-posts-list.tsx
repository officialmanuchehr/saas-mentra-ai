"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryFilter } from "@/components/feed/category-filter";
import { formatRelativeTime } from "@/lib/relative-time";
import { togglePinPost, deletePost } from "@/app/c/[slug]/manage/actions";
import type { FeedCategory } from "@/components/feed/types";

interface ContentPost {
  id: string;
  title: string;
  category_id: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  authorName: string;
}

export function ContentPostsList({
  posts,
  categories,
  communityId,
}: {
  posts: ContentPost[];
  categories: FeedCategory[];
  communityId: string;
}) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentPost | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = activeCategory ? posts.filter((p) => p.category_id === activeCategory) : posts;

  async function handleTogglePin(post: ContentPost) {
    setBusyId(post.id);
    try {
      await togglePinPost(post.id, communityId, !post.is_pinned);
      toast.success(post.is_pinned ? "Пост откреплён" : "Пост закреплён");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось изменить пост");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deletePost(deleteTarget.id, communityId);
      toast.success("Пост удалён");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить пост");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <CategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Постов нет.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => {
            const category = post.category_id ? categoryById.get(post.category_id) : null;
            return (
              <div
                key={post.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.authorName} · {formatRelativeTime(post.created_at)}
                    {category && ` · ${category.emoji ?? ""} ${category.name}`} ·{" "}
                    {post.likes_count} лайков · {post.comments_count} комм.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === post.id}
                  onClick={() => handleTogglePin(post)}
                  className="gap-1.5"
                >
                  {post.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  {post.is_pinned ? "Открепить" : "Закрепить"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={busyId === post.id}
                  onClick={() => setDeleteTarget(post)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить пост?</DialogTitle>
            <DialogDescription>
              «{deleteTarget?.title}» будет удалён без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!busyId}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
