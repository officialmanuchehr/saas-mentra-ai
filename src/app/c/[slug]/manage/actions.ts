"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toEmbedUrl } from "@/lib/video-embed";

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

function parseVideoUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl || !videoUrl.trim()) return null;
  const trimmed = videoUrl.trim();
  if (!toEmbedUrl(trimmed)) {
    throw new Error("Не удалось распознать ссылку. Поддерживаются YouTube и Vimeo.");
  }
  // Хранится исходная ссылка как есть — toEmbedUrl вызывается только для
  // валидации на сохранении, в embed она превращается уже в плеере.
  return trimmed;
}

export async function createModule(courseId: string, communityId: string, title: string) {
  const { supabase } = await requireAdmin(communityId);
  if (!title.trim()) throw new Error("Введите название модуля");

  const { count } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { data, error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, title: title.trim(), sort_order: count ?? 0 })
    .select("id, course_id, title, sort_order")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Не удалось создать модуль");

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
  return { module: { ...data, lessons: [] } };
}

export async function updateModule(moduleId: string, communityId: string, title: string) {
  const { supabase } = await requireAdmin(communityId);
  if (!title.trim()) throw new Error("Введите название модуля");

  const { error } = await supabase.from("modules").update({ title: title.trim() }).eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
}

export async function deleteModule(moduleId: string, communityId: string) {
  const { supabase } = await requireAdmin(communityId);

  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
}

interface LessonInput {
  title: string;
  content: string | null;
  videoUrl: string | null;
}

export async function createLesson(moduleId: string, communityId: string, input: LessonInput) {
  const { supabase } = await requireAdmin(communityId);
  if (!input.title.trim()) throw new Error("Введите название урока");
  const videoUrl = parseVideoUrl(input.videoUrl);

  const { count } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("module_id", moduleId);

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      title: input.title.trim(),
      content: input.content?.trim() || null,
      video_url: videoUrl,
      sort_order: count ?? 0,
    })
    .select("id, module_id, title, video_url, content, duration_min, sort_order")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Не удалось создать урок");

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
  return { lesson: data };
}

export async function updateLesson(lessonId: string, communityId: string, input: LessonInput) {
  const { supabase } = await requireAdmin(communityId);
  if (!input.title.trim()) throw new Error("Введите название урока");
  const videoUrl = parseVideoUrl(input.videoUrl);

  const { error } = await supabase
    .from("lessons")
    .update({
      title: input.title.trim(),
      content: input.content?.trim() || null,
      video_url: videoUrl,
    })
    .eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
}

export async function deleteLesson(lessonId: string, communityId: string) {
  const { supabase } = await requireAdmin(communityId);

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) throw new Error(error.message);

  revalidatePath(`/c/[slug]/courses/[courseId]`, "page");
}
