import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/feed/level-badge";
import { levelFromPoints } from "@/lib/points";

export default async function CommunityMembersPage({ params }: { params: { slug: string } }) {
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
    .order("points", { ascending: false });

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {(memberships ?? []).map((m) => {
        const profile = m.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
        const name = profile?.full_name || "Без имени";
        return (
          <Link
            key={m.user_id}
            href={`/u/${m.user_id}`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center shadow-sm transition-shadow hover:shadow-md"
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{name}</span>
              <LevelBadge level={levelFromPoints(m.points)} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
