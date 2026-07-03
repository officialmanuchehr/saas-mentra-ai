import { CommunityAvatar } from "@/components/communities/community-avatar";

interface CommunityHeaderProps {
  slug: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
}

export function CommunityHeader({ slug, name, avatarUrl, memberCount }: CommunityHeaderProps) {
  return (
    <div className="border-b border-border/60 bg-secondary">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-center gap-4">
          <CommunityAvatar
            slug={slug}
            name={name}
            avatarUrl={avatarUrl}
            className="h-16 w-16 text-xl"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{name}</h1>
            <p className="text-sm text-muted-foreground">{memberCount} участников</p>
          </div>
        </div>
      </div>
    </div>
  );
}
