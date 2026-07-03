import Image from "next/image";
import { communityGradient } from "@/lib/community-gradient";
import { cn } from "@/lib/utils";

interface CommunityAvatarProps {
  slug: string;
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

export function CommunityAvatar({ slug, name, avatarUrl, className }: CommunityAvatarProps) {
  if (avatarUrl) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-2xl", className)}>
        <Image src={avatarUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white/90",
        className
      )}
      style={{ background: communityGradient(slug) }}
    >
      <span className="font-extrabold drop-shadow-sm">{name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}
