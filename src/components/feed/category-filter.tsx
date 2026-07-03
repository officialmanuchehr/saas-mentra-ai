"use client";

import { cn } from "@/lib/utils";
import type { FeedCategory } from "@/components/feed/types";

interface CategoryFilterProps {
  categories: FeedCategory[];
  active: string | null;
  onChange: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          active === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-accent"
        )}
      >
        Все
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            active === c.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          {c.emoji} {c.name}
        </button>
      ))}
    </div>
  );
}
