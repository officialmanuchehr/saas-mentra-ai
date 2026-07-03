// Зеркалит public.level_from_points(points int) из
// supabase/migrations/0002_functions_and_triggers.sql — держите пороги
// в синхроне с SQL-версией, если они изменятся.

const LEVEL_THRESHOLDS = [
  { level: 9, min: 33015 },
  { level: 8, min: 8015 },
  { level: 7, min: 2015 },
  { level: 6, min: 515 },
  { level: 5, min: 155 },
  { level: 4, min: 65 },
  { level: 3, min: 20 },
  { level: 2, min: 5 },
  { level: 1, min: 0 },
] as const;

export function levelFromPoints(points: number): number {
  return LEVEL_THRESHOLDS.find((t) => points >= t.min)?.level ?? 1;
}

export interface LevelProgressInfo {
  level: number;
  points: number;
  nextLevel: number | null;
  pointsToNext: number | null;
  progressPct: number;
  isMaxLevel: boolean;
}

export function getLevelProgress(points: number): LevelProgressInfo {
  const level = levelFromPoints(points);
  const current = LEVEL_THRESHOLDS.find((t) => t.level === level)!;
  const next = LEVEL_THRESHOLDS.find((t) => t.level === level + 1);

  if (!next) {
    return { level, points, nextLevel: null, pointsToNext: null, progressPct: 100, isMaxLevel: true };
  }

  const progressPct = ((points - current.min) / (next.min - current.min)) * 100;

  return {
    level,
    points,
    nextLevel: next.level,
    pointsToNext: next.min - points,
    progressPct: Math.max(0, Math.min(100, progressPct)),
    isMaxLevel: false,
  };
}

export const POINTS = {
  post_created: 2,
  comment_created: 1,
  like_received: 1,
  lesson_completed: 3,
} as const;
