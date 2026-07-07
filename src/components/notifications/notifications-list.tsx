"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/notifications/actions";
import { notificationText, type NotificationItem } from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotificationsListProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleItemClick(notification: NotificationItem) {
    if (notification.is_read) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    markNotificationRead(notification.id);
  }

  function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    markAllNotificationsRead();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Уведомления</h1>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-sm font-medium text-primary hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
        >
          Отметить все прочитанными
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl bg-card py-16 text-center shadow-sm">
          <BellOff className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Пока нет уведомлений</p>
          <p className="text-sm text-muted-foreground">
            Здесь появятся лайки и комментарии к вашим постам.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((notification) => {
            const content = (
              <div
                className={cn(
                  "flex gap-3 rounded-2xl p-4 shadow-sm transition-colors hover:bg-accent",
                  notification.is_read ? "bg-card" : "bg-primary-light"
                )}
              >
                <Avatar className="size-10">
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
              </div>
            );

            return notification.community ? (
              <Link
                key={notification.id}
                href={`/c/${notification.community.slug}`}
                onClick={() => handleItemClick(notification)}
              >
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
