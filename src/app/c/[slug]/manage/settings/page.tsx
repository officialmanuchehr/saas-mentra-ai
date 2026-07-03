import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunitySettingsForm } from "@/components/manage/community-settings-form";

export default async function ManageSettingsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/c/${params.slug}/manage`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name, avatar_url, cover_url")
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

  return (
    <CommunitySettingsForm
      communityId={community.id}
      slug={community.slug}
      name={community.name}
      avatarUrl={community.avatar_url}
      coverUrl={community.cover_url}
    />
  );
}
