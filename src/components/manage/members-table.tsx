"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LevelBadge } from "@/components/feed/level-badge";
import { levelFromPoints } from "@/lib/points";
import { setMemberRole, removeMember } from "@/app/c/[slug]/manage/actions";

interface Member {
  membershipId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member";
  points: number;
  joinedAt: string;
}

const ROLE_LABELS: Record<Member["role"], string> = {
  owner: "Владелец",
  admin: "Админ",
  member: "Участник",
};

export function MembersTable({
  members,
  communityId,
  isOwner,
}: {
  members: Member[];
  communityId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, query]);

  async function handleToggleAdmin(member: Member) {
    setBusyId(member.membershipId);
    try {
      const nextRole = member.role === "admin" ? "member" : "admin";
      await setMemberRole(member.membershipId, communityId, nextRole);
      toast.success(nextRole === "admin" ? "Назначен админом" : "Роль админа снята");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось изменить роль");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setBusyId(removeTarget.membershipId);
    try {
      await removeMember(removeTarget.membershipId, communityId);
      toast.success("Участник удалён из сообщества");
      setRemoveTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить участника");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Поиск по имени..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Участник</th>
              <th className="px-4 py-3 font-medium">Уровень</th>
              <th className="px-4 py-3 font-medium">Очки</th>
              <th className="px-4 py-3 font-medium">Вступил</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              {isOwner && <th className="px-4 py-3 font-medium">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.membershipId} className="border-b border-border/40 last:border-0">
                <td className="flex items-center gap-2 px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name} />
                    <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{m.name}</span>
                </td>
                <td className="px-4 py-3">
                  <LevelBadge level={levelFromPoints(m.points)} />
                </td>
                <td className="px-4 py-3">{m.points}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(m.joinedAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="light">{ROLE_LABELS[m.role]}</Badge>
                </td>
                {isOwner && (
                  <td className="px-4 py-3">
                    {m.role !== "owner" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === m.membershipId}
                          onClick={() => handleToggleAdmin(m)}
                        >
                          {m.role === "admin" ? "Снять админа" : "Сделать админом"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === m.membershipId}
                          onClick={() => setRemoveTarget(m)}
                        >
                          Удалить
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить участника?</DialogTitle>
            <DialogDescription>
              {removeTarget?.name} потеряет доступ к сообществу. Это действие можно отменить,
              только пригласив участника заново.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={!!busyId}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
