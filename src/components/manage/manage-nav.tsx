"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Newspaper, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function ManageNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/c/${slug}/manage`;

  const items = [
    { href: base, label: "Обзор", icon: BarChart3 },
    { href: `${base}/members`, label: "Участники", icon: Users },
    { href: `${base}/content`, label: "Контент", icon: Newspaper },
    { href: `${base}/settings`, label: "Настройки", icon: Settings },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:gap-1">
      {items.map((item) => {
        const isActive = item.href === base ? pathname === base : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:rounded-2xl",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
