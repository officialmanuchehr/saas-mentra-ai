import { Badge } from "@/components/ui/badge";

export function LevelBadge({ level }: { level: number }) {
  return (
    <Badge variant="light" className="px-1.5 py-0 text-[10px] leading-4">
      L{level}
    </Badge>
  );
}
