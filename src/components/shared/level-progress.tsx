import { ProgressBar } from "@/components/shared/progress-bar";
import { getLevelProgress } from "@/lib/points";
import { pluralizeRu } from "@/lib/pluralize";

interface LevelProgressProps {
  points: number;
  label?: string;
}

export function LevelProgress({ points, label }: LevelProgressProps) {
  const { level, nextLevel, pointsToNext, progressPct, isMaxLevel } = getLevelProgress(points);

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Уровень {level}</span>
        <span className="text-sm text-muted-foreground">{points} очков</span>
      </div>
      <ProgressBar value={progressPct} />
      <p className="text-xs text-muted-foreground">
        {isMaxLevel
          ? "Максимальный уровень достигнут!"
          : `До уровня ${nextLevel} осталось ${pointsToNext} ${pluralizeRu(
              pointsToNext ?? 0,
              "очко",
              "очка",
              "очков"
            )}`}
      </p>
    </div>
  );
}
