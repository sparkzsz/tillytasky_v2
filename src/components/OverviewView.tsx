import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CategoryFilter } from "@/components/CategoryFilter";
import { CATEGORY_STYLE, toKey, type Category, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = { tasks: Task[] };

export function OverviewView({ tasks }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: firstDay }, () => null);
    for (let i = 1; i <= daysInMonth; i++) out.push(new Date(year, month, i));
    return out;
  }, [cursor]);

  const doneByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      if (!t.done) continue;
      map.set(t.date, [...(map.get(t.date) ?? []), t]);
    }
    return map;
  }, [filtered]);

  const monthTotal = cells.reduce(
    (sum, d) => (d ? sum + (doneByDay.get(toKey(d))?.length ?? 0) : sum),
    0,
  );
  const todayKey = toKey(new Date());

  return (
    <div className="space-y-6">
      <CategoryFilter active={filter} onChange={setFilter} />

      <div className="card-pop p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-full border-2 border-foreground p-1.5 transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="text-center">
            <h2 className="font-display text-xl">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <p className="text-xs text-muted-foreground">{monthTotal} tasks completed</p>
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-full border-2 border-foreground p-1.5 transition-colors hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;
            const key = toKey(date);
            const dayTasks = doneByDay.get(key) ?? [];
            const count = dayTasks.length;
            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-16 flex-col rounded-lg border-2 p-1.5 text-left transition-colors",
                  count > 0 ? "border-foreground bg-secondary" : "border-border bg-transparent",
                  key === todayKey && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                )}
              >
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {date.getDate()}
                </span>
                {count > 0 && (
                  <>
                    <span className="font-display text-lg leading-tight">{count}</span>
                    <div className="mt-auto flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 6).map((t) => (
                        <span
                          key={t.id}
                          title={t.title}
                          className={cn("size-1.5 rounded-full", CATEGORY_STYLE[t.category].dot)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
