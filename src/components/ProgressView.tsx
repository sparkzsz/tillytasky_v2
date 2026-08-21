import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CategoryFilter } from "@/components/CategoryFilter";
import { CATEGORIES, toKey, type Category, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = { tasks: Task[] };

const RANGES = [7, 14, 30] as const;

export function ProgressView({ tasks }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);

  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of filtered) {
      if (!t.done) continue;
      counts.set(t.date, (counts.get(t.date) ?? 0) + 1);
    }
    const days: { label: string; completed: number; average: number }[] = [];
    let running = 0;
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const completed = counts.get(toKey(d)) ?? 0;
      running += completed;
      days.push({
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        completed,
        average: Number((running / (range - i)).toFixed(2)),
      });
    }
    return days;
  }, [filtered, range]);

  const total = data.reduce((s, d) => s + d.completed, 0);
  const avg = data.length ? total / data.length : 0;
  const bestDay = data.reduce((m, d) => Math.max(m, d.completed), 0);

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    count: tasks.filter((t) => t.done && t.category === c).length,
  }));
  const maxCat = Math.max(1, ...byCategory.map((b) => b.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryFilter active={filter} onChange={setFilter} />
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "chip-outline px-3 py-1 text-sm",
                range === r ? "bg-foreground text-background" : "bg-transparent",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Completed", value: total },
          { label: "Daily average", value: avg.toFixed(1) },
          { label: "Best day", value: bestDay },
        ].map((s) => (
          <div key={s.label} className="card-pop p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-display text-4xl leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card-pop p-5">
        <h2 className="font-display text-xl">Progress over time</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Tasks completed per day, with running average.
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "2px solid var(--foreground)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="var(--chart-1)"
                strokeWidth={3}
                fill="url(#fillCompleted)"
              />
              <Line
                type="monotone"
                dataKey="average"
                name="Average"
                stroke="var(--chart-2)"
                strokeWidth={3}
                strokeDasharray="5 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-pop p-5">
        <h2 className="font-display text-xl">By category</h2>
        <div className="mt-4 space-y-3">
          {byCategory.map((b) => (
            <button
              key={b.category}
              type="button"
              onClick={() => setFilter(filter === b.category ? "all" : b.category)}
              className="flex w-full items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold transition-colors",
                  filter === b.category
                    ? CATEGORY_STYLE[b.category].chip
                    : "text-foreground",
                )}
              >
                {b.category}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-foreground bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(b.count / maxCat) * 100}%`,
                    background: CATEGORY_STYLE[b.category].chart,
                  }}
                />
              </div>
              <span className="w-8 text-right font-display text-sm">{b.count}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
