import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { CategoryFilter } from "@/components/CategoryFilter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categoryStyle, fromKey, toKey, type Category, type Task } from "@/lib/tally";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = { tasks: Task[]; categories: Category[] };

export function OverviewView({ tasks, categories }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
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
  const selectedTasks = selected ? filtered.filter((t) => t.date === selected) : [];


  return (
    <div className="space-y-6">
      <CategoryFilter categories={categories} active={filter} onChange={setFilter} />

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
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex min-h-16 flex-col rounded-lg border-2 p-1.5 text-left transition-transform hover:-translate-y-0.5",
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
                          className={cn("size-1.5 rounded-full", categoryStyle(t.category).dot)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="flex max-h-[85vh] flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selected
                ? fromKey(selected).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"} on this day
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing in your till for this day.
              </p>
            )}
            {selectedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border-2 border-foreground p-3"
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border-2 border-foreground",
                    t.done ? "bg-accent text-accent-foreground" : "bg-transparent",
                  )}
                >
                  {t.done && <Check className="size-4" />}
                </span>
                <span className={cn("min-w-0 flex-1 truncate text-sm font-semibold", t.done && "line-through")}>
                  {t.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                    categoryStyle(t.category).chip,
                  )}
                >
                  {t.category}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

