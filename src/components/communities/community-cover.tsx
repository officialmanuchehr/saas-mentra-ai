import Image from "next/image";
import { communityGradient, coverGradientCss } from "@/lib/community-gradient";
import { cn } from "@/lib/utils";

interface CommunityCoverProps {
  slug: string;
  name: string;
  coverUrl?: string | null;
  className?: string;
  showLabel?: boolean;
}

export function CommunityCover({
  slug,
  name,
  coverUrl,
  className,
  showLabel = true,
}: CommunityCoverProps) {
  const presetGradient = coverUrl ? coverGradientCss(coverUrl) : null;

  if (coverUrl && !presetGradient) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={coverUrl} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden", className)}
      style={{ background: presetGradient ?? communityGradient(slug) }}
    >
      {showLabel && (
        <span className="px-4 text-center text-lg font-extrabold text-white/90 drop-shadow-sm">
          {name}
        </span>
      )}
    </div>
  );
}
