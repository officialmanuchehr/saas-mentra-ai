"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createModule, updateModule } from "@/app/c/[slug]/manage/actions";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  courseId: string;
  target: { id: string; title: string } | null;
  onSaved: () => void;
}

export function ModuleDialog({
  open,
  onOpenChange,
  communityId,
  courseId,
  target,
  onSaved,
}: ModuleDialogProps) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setTitle(target?.title ?? "");
  }, [open, target]);

  async function handleSave() {
    setSubmitting(true);
    try {
      if (target) {
        await updateModule(target.id, communityId, title);
        toast.success("Модуль обновлён");
      } else {
        await createModule(courseId, communityId, title);
        toast.success("Модуль добавлен");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить модуль");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{target ? "Редактировать модуль" : "Новый модуль"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="module-title" className="text-sm font-medium">
            Название
          </label>
          <Input
            id="module-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, «Модуль 1: Основы»"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={submitting || !title.trim()}>
            {submitting ? "Сохраняем..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
