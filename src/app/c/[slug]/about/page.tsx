import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityCover } from "@/components/communities/community-cover";
import { CommunityTabs } from "@/components/communities/community-tabs";
import { JoinButton } from "@/components/communities/join-button";
import { Badge } from "@/components/ui/badge";

export default async function CommunityAboutPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!community) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isMember = Boolean(membership);
  }

  const isFree = community.price_monthly === null;

  return (
    <div>
      {isMember && <CommunityTabs slug={community.slug} />}

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <CommunityCover
          slug={community.slug}
          name={community.name}
          coverUrl={community.cover_url}
          className="h-48 w-full rounded-2xl sm:h-64"
        />

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {community.name}
            </h1>
            <Badge variant="light">
              {isFree ? "Бесплатно" : `${community.price_monthly} ${community.currency}/мес`}
            </Badge>
          </div>

          <p className="text-muted-foreground">{community.description}</p>

          <p className="text-sm text-muted-foreground">{community.member_count} участников</p>

          {isMember ? (
            <Badge variant="light">Вы участник этого сообщества</Badge>
          ) : (
            <JoinButton
              slug={community.slug}
              priceMonthly={community.price_monthly}
              currency={community.currency}
            />
          )}
        </div>
      </div>
    </div>
  );
}
