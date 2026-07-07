import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchNotifications } from "@/lib/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const notifications = await fetchNotifications(supabase, user.id, 50);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
