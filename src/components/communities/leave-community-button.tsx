"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { leaveCommunity } from "@/app/c/[slug]/actions";

export function LeaveCommunityButton({ communityId }: { communityId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLeave() {
    setSubmitting(true);
    try {
      await leaveCommunity(communityId);
      setOpen(false);
      router.push("/communities");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось покинуть сообщество");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Покинуть сообщество
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Покинуть сообщество?</DialogTitle>
            <DialogDescription>
              Вы потеряете доступ к контенту и ваш прогресс в рейтинге. Вернуться можно через
              каталог.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={submitting}>
              {submitting ? "Выходим..." : "Покинуть"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
