"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkSlugAvailable(slug: string) {
  const supabase = createClient();
  const { data } = await supabase.from("communities").select("id").eq("slug", slug).maybeSingle();
  return { available: !data };
}

interface CreateCommunityInput {
  name: string;
  slug: string;
  description: string;
  isPrivate: boolean;
  priceMonthly: number | null;
  currency: string;
  categories: { name: string; emoji: string | null }[];
}

export async function createCommunity(input: CreateCommunityInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  if (!input.name.trim() || !input.slug.trim()) {
    throw new Error("Укажите название и адрес сообщества");
  }

  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      slug: input.slug,
      name: input.name.trim(),
      description: input.description.trim() || null,
      owner_id: user.id,
      is_private: input.isPrivate,
      price_monthly: input.priceMonthly,
      currency: input.currency,
    })
    .select("id, slug")
    .single();

  if (error || !community) {
    if (error?.code === "23505") {
      throw new Error("Сообщество с таким адресом уже существует. Выберите другой.");
    }
    throw new Error(error?.message ?? "Не удалось создать сообщество");
  }

  const { error: membershipError } = await supabase
    .from("memberships")
    .insert({ community_id: community.id, user_id: user.id, role: "owner" });
  if (membershipError) throw new Error(membershipError.message);

  if (input.categories.length > 0) {
    await supabase.from("post_categories").insert(
      input.categories.map((c, i) => ({
        community_id: community.id,
        name: c.name,
        emoji: c.emoji,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/");
  return { slug: community.slug };
}
