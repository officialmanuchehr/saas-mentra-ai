"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityCard } from "@/components/communities/community-card";
import type { Database } from "@/lib/types/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export function CommunityGrid({
  communities,
  memberCommunityIds = [],
}: {
  communities: Community[];
  memberCommunityIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const memberSet = useMemo(() => new Set(memberCommunityIds), [memberCommunityIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) => c.name.toLowerCase().includes(q));
  }, [communities, query]);

  return (
    <div className="space-y-6">
      <Input
        placeholder="Поиск по названию сообщества..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card py-16 text-center shadow-sm">
          <SearchX className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Ничего не найдено</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить запрос.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isMember={memberSet.has(community.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
