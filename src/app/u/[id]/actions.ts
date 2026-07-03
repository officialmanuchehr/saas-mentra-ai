"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(input: { fullName: string; bio: string }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.fullName.trim(), bio: input.bio.trim() || null })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/u/${user.id}`);
}

export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) throw new Error("Файл не выбран");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Кэш-бастер, иначе браузер и CDN могут показывать старую картинку
  // по тому же пути после upsert.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/u/${user.id}`);

  return { avatarUrl };
}

export async function removeAvatar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Требуется вход");

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/u/${user.id}`);
}
