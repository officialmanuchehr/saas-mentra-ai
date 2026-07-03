import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopMembersProps {
  members: { userId: string; name: string; avatarUrl: string | null; points: number }[];
}

export function TopMembers({ members }: TopMembersProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="font-bold">Топ-5 активных за неделю</h3>
      {members.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Пока нет активности за эту неделю.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {members.map((m, i) => (
            <div key={m.userId} className="flex items-center gap-3">
              <span className="w-4 text-sm font-semibold text-muted-foreground">{i + 1}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
              <span className="text-sm font-bold text-primary">+{m.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
