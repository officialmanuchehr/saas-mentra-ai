"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateWeeklySummary } from "@/app/c/[slug]/actions";
import type { FeedPost } from "@/components/feed/types";

interface WeeklySummaryButtonProps {
  communityId: string;
  communityName: string;
  onCreated: (post: FeedPost) => void;
}

export function WeeklySummaryButton({
  communityId,
  communityName,
  onCreated,
}: WeeklySummaryButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { post } = await generateWeeklySummary(communityId, communityName);
      onCreated(post as unknown as FeedPost);
      toast.success("Итоги недели опубликованы!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сгенерировать итоги.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
      onClick={handleClick}
      disabled={loading}
    >
      <Sparkles className="size-4" />
      {loading ? "Генерируем итоги..." : "Сгенерировать итоги недели"}
    </Button>
  );
}
