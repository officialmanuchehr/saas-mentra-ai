import { notFound, redirect } from "next/navigation";
import { Users, FileText, GraduationCap, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/manage/metric-card";
import { GrowthChart } from "@/components/manage/growth-chart";
import { ActivityChart } from "@/components/manage/activity-chart";
import { TopMembers } from "@/components/manage/top-members";
import { RecentJoins } from "@/components/manage/recent-joins";
import {
  buildActivitySeries,
  buildGrowthSeries,
  getOverviewMetrics,
  getRecentJoins,
  getTopMembersWeek,
} from "@/app/c/[slug]/manage/queries";

export default async function ManageOverviewPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/manage`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, member_count, price_monthly, currency")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  if (!isAdmin) {
    redirect(`/c/${params.slug}`);
  }

  const [{ metrics, weekPosts, weekComments }, { data: allJoinedAt }, topMembers, recentJoins] =
    await Promise.all([
      getOverviewMetrics(supabase, community.id, community.member_count, community.price_monthly),
      supabase.from("memberships").select("joined_at").eq("community_id", community.id),
      getTopMembersWeek(supabase, community.id),
      getRecentJoins(supabase, community.id),
    ]);

  const growthSeries = buildGrowthSeries((allJoinedAt ?? []).map((m) => m.joined_at));
  const activitySeries = buildActivitySeries(weekPosts, weekComments);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Участники"
          value={String(metrics.memberCount)}
          icon={Users}
          delta={metrics.newMembersWeek}
        />
        <MetricCard
          label="Посты и комментарии"
          value={String(metrics.newPostsWeek + metrics.newCommentsWeek)}
          icon={FileText}
        />
        <MetricCard
          label="Уроки завершены"
          value={String(metrics.lessonsCompletedWeek)}
          icon={GraduationCap}
        />
        {metrics.mrr !== null && (
          <MetricCard
            label="MRR"
            value={`${metrics.mrr} ${community.currency}`}
            icon={Wallet}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GrowthChart data={growthSeries} />
        <ActivityChart data={activitySeries} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopMembers members={topMembers} />
        <RecentJoins members={recentJoins} />
      </div>
    </div>
  );
}
