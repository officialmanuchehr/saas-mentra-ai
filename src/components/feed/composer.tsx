"use client";

import { useState } from "react";
import Image from "next/image";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageDropzone } from "@/components/shared/image-dropzone";
import { cn } from "@/lib/utils";
import { createPost, uploadPostImage } from "@/app/c/[slug]/actions";
import type { FeedCategory, FeedPost } from "@/components/feed/types";

const MAX_IMAGES = 4;

interface ComposerProps {
  communityId: string;
  categories: FeedCategory[];
  myAvatarUrl: string | null;
  myName: string;
  onCreated: (post: FeedPost) => void;
}

export function Composer({ communityId, categories, myAvatarUrl, myName, onCreated }: ComposerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const initials = myName.slice(0, 2).toUpperCase();

  function reset() {
    setTitle("");
    setContent("");
    setCategoryId(null);
    setImageUrls([]);
  }

  async function handleImageUpload(file: File) {
    const fd = new FormData();
    fd.set("image", file);
    const { url } = await uploadPostImage(fd);
    return url;
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error("Заполните заголовок и текст поста.");
      return;
    }
    setSubmitting(true);
    try {
      const { post, pointsAwarded } = await createPost(communityId, {
        title: title.trim(),
        content: content.trim(),
        categoryId,
        imageUrls,
      });
      onCreated(post as unknown as FeedPost);
      toast.success(`+${pointsAwarded} очка!`);
      reset();
      setOpen(false);
    } catch {
      toast.error("Не удалось опубликовать пост. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-left text-muted-foreground shadow-sm transition-colors hover:bg-accent/40"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={myAvatarUrl ?? undefined} alt={myName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        Напишите что-нибудь...
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новый пост</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="О чём хотите рассказать?"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                      categoryId === c.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    )}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {imageUrls.map((url, index) => (
                <div key={url} className="relative size-16 overflow-hidden rounded-xl">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                    aria-label="Удалить изображение"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {imageUrls.length < MAX_IMAGES && (
                <ImageDropzone
                  label="Прикрепить фото"
                  compact
                  maxDimension={1200}
                  upload={handleImageUpload}
                  onUploaded={(url) => setImageUrls((prev) => [...prev, url])}
                />
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="size-3" /> До {MAX_IMAGES} фото к посту
            </p>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Публикуем..." : "Опубликовать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
