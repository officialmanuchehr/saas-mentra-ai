import { createClient } from "@/lib/supabase/server";
import { CommunityGrid } from "@/components/communities/community-grid";

export default async function Home() {
  const supabase = createClient();
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memberCommunityIds: string[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("memberships")
      .select("community_id")
      .eq("user_id", user.id);
    memberCommunityIds = (memberships ?? []).map((m) => m.community_id);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Сообщества</h1>
      <p className="mt-1 text-muted-foreground">
        Найдите сообщество по интересам и начните учиться вместе.
      </p>
      <div className="mt-8">
        <CommunityGrid communities={communities ?? []} memberCommunityIds={memberCommunityIds} />
      </div>
    </div>
  );
}
