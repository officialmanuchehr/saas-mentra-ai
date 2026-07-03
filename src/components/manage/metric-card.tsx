import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
}

export function MetricCard({ label, value, icon: Icon, delta }: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight">{value}</span>
        {typeof delta === "number" && delta !== 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              delta > 0 ? "text-success" : "text-destructive"
            )}
          >
            {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {delta > 0 ? "+" : ""}
            {delta} за 7 дней
          </span>
        )}
      </div>
    </div>
  );
}
