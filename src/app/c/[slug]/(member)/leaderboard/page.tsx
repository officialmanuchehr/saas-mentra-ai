import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/feed/level-badge";
import { HowToEarnPoints } from "@/components/leaderboard/how-to-earn-points";
import { levelFromPoints } from "@/lib/points";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function CommunityLeaderboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/about`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, points, profiles(full_name, avatar_url)")
    .eq("community_id", community.id)
    .order("points", { ascending: false })
    .limit(30);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-2">
        {(memberships ?? []).map((m, index) => {
          const profile = m.profiles as unknown as {
            full_name: string | null;
            avatar_url: string | null;
          } | null;
          const name = profile?.full_name || "Без имени";
          const isMe = m.user_id === user.id;
          const isTop3 = index < 3;

          return (
            <Link
              key={m.user_id}
              href={`/u/${m.user_id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-card shadow-sm transition-shadow hover:shadow-md",
                isTop3 ? "p-4" : "p-3",
                isMe && "ring-2 ring-primary"
              )}
            >
              <span
                className={cn(
                  "text-center font-bold text-muted-foreground",
                  isTop3 ? "w-8 text-2xl" : "w-6 text-sm"
                )}
              >
                {isTop3 ? MEDALS[index] : index + 1}
              </span>
              <Avatar className={isTop3 ? "h-14 w-14" : "h-10 w-10"}>
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
                <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-center gap-1.5">
                <span className={cn("font-semibold", isTop3 && "text-lg")}>{name}</span>
                <LevelBadge level={levelFromPoints(m.points)} />
              </div>
              <span className={cn("font-bold text-primary", isTop3 ? "text-base" : "text-sm")}>
                {m.points} оч.
              </span>
            </Link>
          );
        })}
      </div>

      <aside>
        <HowToEarnPoints />
      </aside>
    </div>
  );
}
