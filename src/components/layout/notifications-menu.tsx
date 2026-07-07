"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead, markAllNotificationsRead } from "@/app/notifications/actions";
import { NOTIFICATION_SELECT, notificationText, type NotificationItem } from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationsMenuProps {
  userId: string;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

export function NotificationsMenu({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationsMenuProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async (payload) => {
          const { data } = await supabase
            .from("notifications")
            .select(NOTIFICATION_SELECT)
            .eq("id", payload.new.id)
            .single();
          if (!data) return;
          setNotifications((prev) => [data as unknown as NotificationItem, ...prev].slice(0, 10));
          setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function handleItemClick(notification: NotificationItem) {
    if (notification.is_read) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    markNotificationRead(notification.id);
  }

  function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    markAllNotificationsRead();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-full p-2 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="px-4 py-3 font-semibold">Уведомления</div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-[420px] overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="size-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Пока нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                >
                  <Link
                    href={notification.community ? `/c/${notification.community.slug}` : "/notifications"}
                    onClick={() => handleItemClick(notification)}
                    className={cn(
                      "flex gap-3 rounded-xl p-3 transition-colors hover:bg-accent",
                      !notification.is_read && "bg-primary-light"
                    )}
                  >
                    <Avatar className="size-9">
                      <AvatarImage
                        src={notification.actor?.avatar_url ?? undefined}
                        alt={notification.actor?.full_name ?? ""}
                      />
                      <AvatarFallback>
                        {(notification.actor?.full_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm leading-snug text-foreground">
                        {notificationText(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-sm font-medium text-primary hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
          >
            Отметить все прочитанными
          </button>
          <DropdownMenuItem asChild className="w-auto p-0 focus:bg-transparent">
            <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
              Все уведомления
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
