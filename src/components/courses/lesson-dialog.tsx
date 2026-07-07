"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createLesson, updateLesson } from "@/app/c/[slug]/manage/actions";
import { toEmbedUrl } from "@/lib/video-embed";
import type { CourseLesson } from "@/components/courses/types";

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  moduleId: string | null;
  target: CourseLesson | null;
  onSaved: () => void;
}

export function LessonDialog({
  open,
  onOpenChange,
  communityId,
  moduleId,
  target,
  onSaved,
}: LessonDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(target?.title ?? "");
      setContent(target?.content ?? "");
      setVideoUrl(target?.video_url ?? "");
    }
  }, [open, target]);

  const trimmedUrl = videoUrl.trim();
  const embedUrl = trimmedUrl ? toEmbedUrl(trimmedUrl) : null;
  const urlError = trimmedUrl && !embedUrl;

  const canSave = useMemo(() => title.trim().length > 0 && !urlError, [title, urlError]);

  async function handleSave() {
    setSubmitting(true);
    try {
      const input = { title, content: content || null, videoUrl: trimmedUrl || null };
      if (target) {
        await updateLesson(target.id, communityId, input);
        toast.success("Урок обновлён");
      } else if (moduleId) {
        await createLesson(moduleId, communityId, input);
        toast.success("Урок добавлен");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить урок");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{target ? "Редактировать урок" : "Новый урок"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="lesson-title" className="text-sm font-medium">
              Название
            </label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, «Урок 1: Знакомство»"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lesson-content" className="text-sm font-medium">
              Описание
            </label>
            <Textarea
              id="lesson-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="О чём этот урок..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lesson-video" className="text-sm font-medium">
              Видео
            </label>
            <Input
              id="lesson-video"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={urlError ? "border-destructive focus-visible:ring-destructive" : undefined}
            />
            {urlError ? (
              <p className="text-sm text-destructive">
                Не удалось распознать ссылку. Поддерживаются YouTube и Vimeo.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Вставьте ссылку на YouTube или Vimeo
              </p>
            )}
          </div>

          {embedUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm">
              <iframe
                src={embedUrl}
                title="Предпросмотр видео"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={submitting || !canSave}>
            {submitting ? "Сохраняем..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
