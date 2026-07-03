"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireOwner(communityId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner") {
    throw new Error("Только владелец сообщества может выполнить это действие");
  }
  return { supabase, userId: user.id };
}

async function requireAdmin(communityId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner" && membership?.role !== "admin") {
    throw new Error("Недостаточно прав для этого действия");
  }
  return { supabase, userId: user.id };
}

export async function setMemberRole(
  membershipId: string,
  communityId: string,
  role: "admin" | "member"
) {
  const { supabase } = await requireOwner(communityId);

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .single();
  if (target?.role === "owner") {
    throw new Error("Нельзя изменить роль владельца сообщества");
  }

  const { error } = await supabase.from("memberships").update({ role }).eq("id", membershipId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/manage/members`, "page");
}

export async function removeMember(membershipId: string, communityId: string) {
  const { supabase } = await requireOwner(communityId);

  const { data: target } = await supabase
    .from("memberships")
    .select("role")
    .eq("id", membershipId)
    .single();
  if (target?.role === "owner") {
    throw new Error("Нельзя удалить владельца сообщества");
  }

  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/manage/members`, "page");
}

export async function togglePinPost(postId: string, communityId: string, pinned: boolean) {
  const { supabase } = await requireAdmin(communityId);

  const { error } = await supabase.from("posts").update({ is_pinned: pinned }).eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/manage/content`, "page");
}

export async function deletePost(postId: string, communityId: string) {
  const { supabase } = await requireAdmin(communityId);

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/manage/content`, "page");
}

export async function uploadCommunityImage(
  communityId: string,
  kind: "avatar" | "cover",
  formData: FormData
) {
  await requireAdmin(communityId);

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Файл не выбран");

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${communityId}/${kind}.${ext}`;

  // Загрузка в Storage разрешена is_admin() напрямую (см. миграцию 0007),
  // обычного клиента достаточно.
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from("community-images")
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-images").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  // communities_update_owner в RLS разрешает UPDATE только владельцу — но
  // раздел "Управление" (включая Настройки) доступен owner/admin, поэтому
  // здесь нужен admin-клиент в обход этой политики. requireAdmin() выше уже
  // проверил права вызывающего, так что это узкий, явно проверенный случай
  // (тот же паттерн, что и системный пост-бот в generateWeeklySummary).
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("communities")
    .update(kind === "avatar" ? { avatar_url: url } : { cover_url: url })
    .eq("id", communityId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/c/[slug]`, "layout");
  return { url };
}

export async function setCommunityCoverGradient(communityId: string, gradientKey: string) {
  await requireAdmin(communityId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("communities")
    .update({ cover_url: `gradient:${gradientKey}` })
    .eq("id", communityId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]`, "layout");
}
