"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface GrowthChartProps {
  data: { date: string; count: number }[];
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="font-bold">Рост участников за 30 дней</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B6EF5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#5B6EF5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 13 }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value) => [value, "Участников"]}
            />
            <Area type="monotone" dataKey="count" stroke="#5B6EF5" strokeWidth={2} fill="url(#growthGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
