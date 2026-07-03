import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersTable } from "@/components/manage/members-table";

export default async function ManageMembersPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/manage`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("slug", params.slug)
    .single();
  if (!community) {
    notFound();
  }

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = myMembership?.role === "owner" || myMembership?.role === "admin";
  if (!isAdmin) {
    redirect(`/c/${params.slug}`);
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, user_id, role, points, joined_at, profiles(full_name, avatar_url)")
    .eq("community_id", community.id)
    .order("joined_at", { ascending: false });

  const members = (memberships ?? []).map((m) => {
    const profile = m.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
    return {
      membershipId: m.id,
      userId: m.user_id,
      name: profile?.full_name || "Без имени",
      avatarUrl: profile?.avatar_url ?? null,
      role: m.role,
      points: m.points,
      joinedAt: m.joined_at,
    };
  });

  return (
    <MembersTable
      members={members}
      communityId={community.id}
      isOwner={myMembership?.role === "owner"}
    />
  );
}
