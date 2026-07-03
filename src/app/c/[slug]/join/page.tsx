import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunityAvatar } from "@/components/communities/community-avatar";
import { PaymentForm } from "@/components/checkout/payment-form";

export default async function CheckoutPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name, avatar_url, price_monthly, currency")
    .eq("slug", params.slug)
    .single();

  if (!community) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/register?next=/c/${params.slug}/join&community=${encodeURIComponent(community.name)}`
    );
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect(`/c/${params.slug}`);
  }

  if (community.price_monthly === null) {
    // Бесплатное сообщество — сразу создаём членство и ведём внутрь.
    const { error } = await supabase
      .from("memberships")
      .insert({ community_id: community.id, user_id: user.id });

    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }

    redirect(`/c/${params.slug}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <CommunityAvatar
          slug={community.slug}
          name={community.name}
          avatarUrl={community.avatar_url}
          className="h-12 w-12 text-base"
        />
        <div>
          <p className="text-sm text-muted-foreground">Вступление в сообщество</p>
          <h1 className="font-bold">{community.name}</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-muted-foreground">К оплате</span>
          <span className="text-2xl font-extrabold">
            {community.price_monthly} {community.currency}
            <span className="text-sm font-normal text-muted-foreground">/мес</span>
          </span>
        </div>

        <PaymentForm
          communityId={community.id}
          slug={community.slug}
          communityName={community.name}
          amount={community.price_monthly}
          currency={community.currency}
        />
      </div>
    </div>
  );
}
