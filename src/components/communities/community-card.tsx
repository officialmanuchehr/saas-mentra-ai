import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommunityCover } from "@/components/communities/community-cover";
import { CommunityAvatar } from "@/components/communities/community-avatar";
import { pluralizeRu } from "@/lib/pluralize";
import type { Database } from "@/lib/types/database.types";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export function CommunityCard({
  community,
  isMember = false,
}: {
  community: Community;
  isMember?: boolean;
}) {
  const isFree = community.price_monthly === null;
  const href = isMember ? `/c/${community.slug}` : `/c/${community.slug}/about`;

  return (
    <Link href={href}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CommunityCover
          slug={community.slug}
          name={community.name}
          coverUrl={community.cover_url}
          className="h-36 w-full"
        />
        <CardContent className="space-y-2 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CommunityAvatar
                slug={community.slug}
                name={community.name}
                avatarUrl={community.avatar_url}
                className="size-8 text-xs"
              />
              <h3 className="truncate font-bold leading-tight">{community.name}</h3>
            </div>
            {isMember ? (
              <Badge variant="light" className="shrink-0 gap-1">
                <CheckCircle2 className="size-3" /> Вы участник
              </Badge>
            ) : isFree ? (
              <Badge variant="light" className="shrink-0">
                Бесплатно
              </Badge>
            ) : (
              <Badge variant="light" className="shrink-0">
                {community.price_monthly} {community.currency}/мес
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {community.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {community.member_count}{" "}
            {pluralizeRu(community.member_count, "участник", "участника", "участников")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
