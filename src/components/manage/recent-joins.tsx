import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/relative-time";

interface RecentJoinsProps {
  members: { userId: string; name: string; avatarUrl: string | null; joinedAt: string }[];
}

export function RecentJoins({ members }: RecentJoinsProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="font-bold">Последние вступившие</h3>
      {members.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Пока никто не вступил.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(m.joinedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
