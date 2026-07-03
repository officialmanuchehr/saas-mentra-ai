"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function CommunityTabs({ slug, isAdmin = false }: { slug: string; isAdmin?: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/c/${slug}`, label: "Лента" },
    { href: `/c/${slug}/courses`, label: "Курсы" },
    { href: `/c/${slug}/members`, label: "Участники" },
    { href: `/c/${slug}/leaderboard`, label: "Лидерборд" },
    { href: `/c/${slug}/about`, label: "О сообществе" },
    ...(isAdmin ? [{ href: `/c/${slug}/manage`, label: "Управление" }] : []),
  ];

  return (
    <nav className="border-b border-border/60 bg-background">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
        {tabs.map((tab) => {
          const isActive = tab.href === `/c/${slug}` ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
