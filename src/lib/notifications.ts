import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export interface NotificationItem {
  id: string;
  type: Database["public"]["Enums"]["notification_type"];
  is_read: boolean;
  created_at: string;
  actor: { full_name: string | null; avatar_url: string | null } | null;
  community: { slug: string; name: string } | null;
  post: { title: string } | null;
}

export const NOTIFICATION_SELECT =
  "id, type, is_read, created_at, actor:profiles!notifications_actor_id_fkey(full_name, avatar_url), community:communities(slug, name), post:posts(title)";

export async function fetchNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number
): Promise<NotificationItem[]> {
  const { data } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as NotificationItem[];
}

export async function fetchUnreadNotificationsCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return count ?? 0;
}

export function notificationText(n: Pick<NotificationItem, "type" | "actor" | "post">): string {
  const actorName = n.actor?.full_name || "Кто-то";
  const title = n.post?.title ?? "";

  switch (n.type) {
    case "comment_on_post":
      return `${actorName} оставил(а) комментарий к посту «${title}»`;
    case "reply_to_comment":
      return `${actorName} ответил(а) на ваш комментарий в посте «${title}»`;
    case "like_post":
      return `${actorName} оценил(а) ваш пост «${title}»`;
    case "like_comment":
      return `${actorName} оценил(а) ваш комментарий в посте «${title}»`;
    default:
      return "Новое уведомление";
  }
}
