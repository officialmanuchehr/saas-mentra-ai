"use client";

import { useMemo, useState } from "react";
import { Check, CircleDot, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getEmbedUrl } from "@/lib/video-embed";
import { cn } from "@/lib/utils";
import { completeLesson } from "@/app/c/[slug]/actions";
import type { CourseModule } from "@/components/courses/types";

interface CourseViewerProps {
  communityId: string;
  courseTitle: string;
  modules: CourseModule[];
  initialCompletedLessonIds: string[];
}

export function CourseViewer({
  communityId,
  courseTitle,
  modules,
  initialCompletedLessonIds,
}: CourseViewerProps) {
  const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompletedLessonIds));
  const [submitting, setSubmitting] = useState(false);

  const firstIncomplete = allLessons.find((l) => !completed.has(l.id));
  const [selectedId, setSelectedId] = useState<string | null>(
    (firstIncomplete ?? allLessons[0])?.id ?? null
  );

  const selectedLesson = allLessons.find((l) => l.id === selectedId) ?? null;
  const selectedIndex = allLessons.findIndex((l) => l.id === selectedId);
  const nextLesson = selectedIndex >= 0 ? allLessons[selectedIndex + 1] : undefined;
  const embedUrl = getEmbedUrl(selectedLesson?.video_url ?? null);
  const isCompleted = selectedLesson ? completed.has(selectedLesson.id) : false;

  async function handleComplete() {
    if (!selectedLesson) return;
    setSubmitting(true);
    try {
      const { pointsAwarded, nextLessonId } = await completeLesson(selectedLesson.id, communityId);
      setCompleted((prev) => new Set(prev).add(selectedLesson.id));
      if (pointsAwarded > 0) {
        toast.success(`+${pointsAwarded} очка!`);
      }
      if (nextLessonId) {
        setSelectedId(nextLessonId);
      } else {
        toast.message("Это был последний урок курса 🎉");
      }
    } catch {
      toast.error("Не удалось отметить урок пройденным.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <h2 className="font-bold">{courseTitle}</h2>
        {modules.map((m) => (
          <div key={m.id}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {m.title}
            </p>
            <div className="space-y-0.5">
              {m.lessons.map((l) => {
                const done = completed.has(l.id);
                const active = l.id === selectedId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                    )}
                  >
                    {done ? (
                      <Check className="size-4 shrink-0 text-primary" />
                    ) : active ? (
                      <Play className="size-4 shrink-0" />
                    ) : (
                      <CircleDot className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{l.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <section className="space-y-4">
        {selectedLesson ? (
          <>
            {embedUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm">
                <iframe
                  src={embedUrl}
                  title={selectedLesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{selectedLesson.title}</h1>
              {selectedLesson.duration_min && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedLesson.duration_min} мин
                </p>
              )}
            </div>

            {selectedLesson.content && (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {selectedLesson.content}
              </p>
            )}

            <Button
              onClick={isCompleted ? () => nextLesson && setSelectedId(nextLesson.id) : handleComplete}
              disabled={submitting || (isCompleted && !nextLesson)}
              variant={isCompleted && !nextLesson ? "secondary" : "default"}
            >
              {isCompleted ? (nextLesson ? "Следующий урок →" : "Урок пройден ✓") : "Урок пройден"}
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">В этом курсе пока нет уроков.</p>
        )}
      </section>
    </div>
  );
}
