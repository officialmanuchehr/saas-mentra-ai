"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Rocket } from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";

export function OnboardingChoice() {
  const router = useRouter();
  const [loading, setLoading] = useState<"learn" | "create" | null>(null);

  async function handleChoice(choice: "learn" | "create") {
    setLoading(choice);
    try {
      await completeOnboarding();
      router.push(choice === "learn" ? "/" : "/create");
      router.refresh();
    } catch {
      toast.error("Не удалось сохранить выбор. Попробуйте снова.");
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6">
      <button
        type="button"
        onClick={() => handleChoice("learn")}
        disabled={!!loading}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:border-primary hover:shadow-md disabled:opacity-60"
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-light">
          <GraduationCap className="size-7 text-primary" />
        </div>
        <span className="text-lg font-bold">Я хочу учиться</span>
        <p className="text-sm text-muted-foreground">
          Найду сообщество по интересам и присоединюсь к нему
        </p>
        {loading === "learn" && <span className="text-xs text-primary">Сохраняем...</span>}
      </button>

      <button
        type="button"
        onClick={() => handleChoice("create")}
        disabled={!!loading}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:border-primary hover:shadow-md disabled:opacity-60"
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-light">
          <Rocket className="size-7 text-primary" />
        </div>
        <span className="text-lg font-bold">Я создаю сообщество</span>
        <p className="text-sm text-muted-foreground">
          Запущу своё сообщество для учеников или клиентов
        </p>
        {loading === "create" && <span className="text-xs text-primary">Сохраняем...</span>}
      </button>
    </div>
  );
}
