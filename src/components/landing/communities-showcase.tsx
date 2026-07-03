import Link from "next/link";
import { CommunityCard } from "@/components/communities/community-card";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/types/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export function CommunitiesShowcase({ communities }: { communities: Community[] }) {
  if (communities.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Уже растут на Mentra AI</h2>
            <p className="mt-2 text-muted-foreground">
              Сообщества по продажам, языкам, здоровью и бизнесу — присоединяйтесь.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Все сообщества</Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      </div>
    </section>
  );
}
