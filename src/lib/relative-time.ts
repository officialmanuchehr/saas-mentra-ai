import { pluralizeRu } from "@/lib/pluralize";

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 60) return "только что";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} ${pluralizeRu(diffMin, "минуту", "минуты", "минут")} назад`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour} ${pluralizeRu(diffHour, "час", "часа", "часов")} назад`;
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay} ${pluralizeRu(diffDay, "день", "дня", "дней")} назад`;
  }

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
