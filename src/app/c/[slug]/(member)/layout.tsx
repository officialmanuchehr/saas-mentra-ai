import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityHeader } from "@/components/communities/community-header";
import { CommunityTabs } from "@/components/communities/community-tabs";

export default async function CommunityMemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/c/${params.slug}/about`);
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name, avatar_url, member_count")
    .eq("slug", params.slug)
    .single();

  if (!community) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/c/${params.slug}/about`);
  }

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  return (
    <div>
      <CommunityHeader
        slug={community.slug}
        name={community.name}
        avatarUrl={community.avatar_url}
        memberCount={community.member_count}
      />
      <CommunityTabs slug={community.slug} isAdmin={isAdmin} />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
