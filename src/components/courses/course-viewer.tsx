"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleDot, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toEmbedUrl } from "@/lib/video-embed";
import { cn } from "@/lib/utils";
import { completeLesson } from "@/app/c/[slug]/actions";
import { deleteModule, deleteLesson } from "@/app/c/[slug]/manage/actions";
import { ModuleDialog } from "@/components/courses/module-dialog";
import { LessonDialog } from "@/components/courses/lesson-dialog";
import { DeleteItemDialog } from "@/components/courses/delete-item-dialog";
import type { CourseModule, CourseLesson } from "@/components/courses/types";

interface CourseViewerProps {
  communityId: string;
  courseId: string;
  courseTitle: string;
  modules: CourseModule[];
  initialCompletedLessonIds: string[];
  isAdmin?: boolean;
}

export function CourseViewer({
  communityId,
  courseId,
  courseTitle,
  modules,
  initialCompletedLessonIds,
  isAdmin = false,
}: CourseViewerProps) {
  const router = useRouter();
  const allLessons = useMemo(() => modules.flatMap((m) => m.lessons), [modules]);
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompletedLessonIds));
  const [submitting, setSubmitting] = useState(false);

  const firstIncomplete = allLessons.find((l) => !completed.has(l.id));
  const [selectedId, setSelectedId] = useState<string | null>(
    (firstIncomplete ?? allLessons[0])?.id ?? null
  );

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<CourseModule | null>(null);

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<CourseLesson | null>(null);

  const selectedLesson = allLessons.find((l) => l.id === selectedId) ?? null;
  const selectedIndex = allLessons.findIndex((l) => l.id === selectedId);
  const nextLesson = selectedIndex >= 0 ? allLessons[selectedIndex + 1] : undefined;
  const embedUrl = toEmbedUrl(selectedLesson?.video_url);
  const isCompleted = selectedLesson ? completed.has(selectedLesson.id) : false;

  function refresh() {
    router.refresh();
  }

  function openCreateModule() {
    setEditingModule(null);
    setModuleDialogOpen(true);
  }

  function openEditModule(m: CourseModule) {
    setEditingModule(m);
    setModuleDialogOpen(true);
  }

  function openCreateLesson(moduleId: string) {
    setEditingLesson(null);
    setActiveModuleId(moduleId);
    setLessonDialogOpen(true);
  }

  function openEditLesson(l: CourseLesson) {
    setEditingLesson(l);
    setActiveModuleId(l.module_id);
    setLessonDialogOpen(true);
  }

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
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {m.title}
              </p>
              {isAdmin && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => openEditModule(m)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Редактировать модуль"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModuleTarget(m)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                    aria-label="Удалить модуль"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              {m.lessons.map((l) => {
                const done = completed.has(l.id);
                const active = l.id === selectedId;
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-xl transition-colors",
                      active ? "bg-primary/10" : "hover:bg-accent"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(l.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-sm",
                        active && "font-medium text-primary"
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
                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-0.5 pr-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEditLesson(l)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                          aria-label="Редактировать урок"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteLessonTarget(l)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                          aria-label="Удалить урок"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openCreateLesson(m.id)}
                className="mt-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-3.5" /> Добавить урок
              </button>
            )}
          </div>
        ))}

        {isAdmin && (
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={openCreateModule}>
            <Plus className="size-4" /> Добавить модуль
          </Button>
        )}
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

      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        communityId={communityId}
        courseId={courseId}
        target={editingModule}
        onSaved={refresh}
      />

      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        communityId={communityId}
        moduleId={activeModuleId}
        target={editingLesson}
        onSaved={refresh}
      />

      <DeleteItemDialog
        open={!!deleteModuleTarget}
        onOpenChange={(open) => !open && setDeleteModuleTarget(null)}
        title="Удалить модуль?"
        description={`Модуль «${deleteModuleTarget?.title}» и все его уроки будут удалены без возможности восстановления.`}
        onConfirm={async () => {
          if (deleteModuleTarget) await deleteModule(deleteModuleTarget.id, communityId);
        }}
        onDeleted={refresh}
      />

      <DeleteItemDialog
        open={!!deleteLessonTarget}
        onOpenChange={(open) => !open && setDeleteLessonTarget(null)}
        title="Удалить урок?"
        description={`Урок «${deleteLessonTarget?.title}» будет удалён без возможности восстановления.`}
        onConfirm={async () => {
          if (deleteLessonTarget) await deleteLesson(deleteLessonTarget.id, communityId);
        }}
        onDeleted={refresh}
      />
    </div>
  );
}
