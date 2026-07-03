// Агрегации для дашборда "Управление". Небольшие датасеты (MVP-масштаб
// seed-данных), поэтому группировки/суммы считаются в JS поверх сырых
// строк, а не через SQL-функции/материализованные представления — тот же
// подход, что уже используется в проекте для pointsByAuthor и прогресса
// курса.

import type { createClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createClient>;

export function daysAgoISO(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export interface OverviewMetrics {
  memberCount: number;
  newMembersWeek: number;
  newPostsWeek: number;
  newCommentsWeek: number;
  lessonsCompletedWeek: number;
  mrr: number | null;
}

export async function getOverviewMetrics(
  supabase: Supabase,
  communityId: string,
  memberCount: number,
  priceMonthly: number | null
): Promise<{
  metrics: OverviewMetrics;
  weekPosts: { created_at: string }[];
  weekComments: { created_at: string }[];
}> {
  const weekAgo = daysAgoISO(7);

  const [{ count: newMembersWeek }, { data: weekPostsData }, { data: weekCommentsData }, lessonsWeek, mrr] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId)
        .gte("joined_at", weekAgo),
      supabase
        .from("posts")
        .select("created_at")
        .eq("community_id", communityId)
        .gte("created_at", weekAgo),
      supabase
        .from("comments")
        .select("created_at, posts!inner(community_id)")
        .eq("posts.community_id", communityId)
        .gte("created_at", weekAgo),
      getLessonsCompletedThisWeek(supabase, communityId, weekAgo),
      priceMonthly !== null ? getMrr(supabase, communityId) : Promise.resolve(null),
    ]);

  const weekPosts = weekPostsData ?? [];
  const weekComments = weekCommentsData ?? [];

  return {
    metrics: {
      memberCount,
      newMembersWeek: newMembersWeek ?? 0,
      newPostsWeek: weekPosts.length,
      newCommentsWeek: weekComments.length,
      lessonsCompletedWeek: lessonsWeek,
      mrr,
    },
    weekPosts,
    weekComments,
  };
}

async function getLessonsCompletedThisWeek(supabase: Supabase, communityId: string, weekAgo: string) {
  const { data: courses } = await supabase
    .from("courses")
    .select("modules(lessons(id))")
    .eq("community_id", communityId);

  const lessonIds = (courses ?? []).flatMap((c) =>
    (c.modules as unknown as { lessons: { id: string }[] }[]).flatMap((m) => m.lessons.map((l) => l.id))
  );
  if (lessonIds.length === 0) return 0;

  const { count } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .in("lesson_id", lessonIds)
    .gte("completed_at", weekAgo);

  return count ?? 0;
}

async function getMrr(supabase: Supabase, communityId: string) {
  const { data } = await supabase
    .from("subscriptions")
    .select("amount")
    .eq("community_id", communityId)
    .eq("status", "active");

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

// ── графики ──────────────────────────────────────────────────────────

export function buildGrowthSeries(joinedAtDates: string[], days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = joinedAtDates.filter((d) => new Date(d) < dayEnd).length;
    series.push({
      date: day.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      count,
    });
  }
  return series;
}

export function buildActivitySeries(
  posts: { created_at: string }[],
  comments: { created_at: string }[],
  days = 7
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series: { date: string; posts: number; comments: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const inRange = (list: { created_at: string }[]) =>
      list.filter((item) => {
        const d = new Date(item.created_at);
        return d >= day && d < dayEnd;
      }).length;

    series.push({
      date: day.toLocaleDateString("ru-RU", { weekday: "short" }),
      posts: inRange(posts),
      comments: inRange(comments),
    });
  }
  return series;
}

// ── топ участников и последние вступившие ───────────────────────────

interface ProfileInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export async function getTopMembersWeek(supabase: Supabase, communityId: string) {
  const weekAgo = daysAgoISO(7);

  const { data } = await supabase
    .from("points_events")
    .select("points, memberships!inner(user_id, community_id, profiles(full_name, avatar_url))")
    .eq("memberships.community_id", communityId)
    .gte("created_at", weekAgo);

  const totals = new Map<string, { points: number; profile: ProfileInfo | null }>();
  for (const row of data ?? []) {
    const membership = row.memberships as unknown as { user_id: string; profiles: ProfileInfo | null };
    const existing = totals.get(membership.user_id);
    totals.set(membership.user_id, {
      points: (existing?.points ?? 0) + row.points,
      profile: membership.profiles,
    });
  }

  return Array.from(totals.entries())
    .map(([userId, v]) => ({
      userId,
      name: v.profile?.full_name || "Без имени",
      avatarUrl: v.profile?.avatar_url ?? null,
      points: v.points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
}

export async function getRecentJoins(supabase: Supabase, communityId: string) {
  const { data } = await supabase
    .from("memberships")
    .select("user_id, joined_at, profiles(full_name, avatar_url)")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((m) => {
    const profile = m.profiles as unknown as ProfileInfo | null;
    return {
      userId: m.user_id,
      name: profile?.full_name || "Без имени",
      avatarUrl: profile?.avatar_url ?? null,
      joinedAt: m.joined_at,
    };
  });
}
