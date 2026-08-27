import { useMemo, useState } from "react";
import { Check, Flame, Pencil, Trash2, Trophy } from "lucide-react";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import {
  bestRecord,
  categoryStyle,
  countsByDay,
  fireConfetti,
  toKey,
  type Category,
  type Task,
} from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  categories: Category[];
  onAdd: (title: string, category: Category, date: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    patch: { title: string; category: Category; date: string; description: string | null },
  ) => void;
};

export function TodayView({ tasks, categories, onAdd, onToggle, onRemove, onUpdate }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const today = toKey(new Date());

  const todays = useMemo(() => tasks.filter((t) => t.date === today), [tasks, today]);
  const visible = filter === "all" ? todays : todays.filter((t) => t.category === filter);
  const completed = todays.filter((t) => t.done).length;

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toKey(d);
  }, []);
  const yesterday = countsByDay(tasks).get(yesterdayKey) ?? 0;
  const { best } = bestRecord(tasks, today);
  const toBeat = Math.max(best, yesterday);

function handleToggle(task: Task, el: HTMLButtonElement) {
    onToggle(task.id);
    if (!task.done) {
      const rect = el.getBoundingClientRect();
      fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-pop p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s Till
          </p>
          <p className="mt-1 font-display text-5xl leading-none text-primary">{completed}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {todays.length - completed} still open
          </p>
        </div>
        <div className="card-pop p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Yesterday
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-5xl leading-none">
            {yesterday}
            <Flame className="size-6 text-tang" />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed > yesterday ? "You already beat it!" : `${yesterday - completed + 1} to pass it`}
          </p>
        </div>
        <div className="card-pop p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            All-time record
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-5xl leading-none">
            {Math.max(best, completed)}
            <Trophy className="size-6 text-accent" />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed > toBeat ? "New record in progress!" : `Beat ${toBeat} to set a new one`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryFilter categories={categories} active={filter} onChange={setFilter} />
        <AddTaskDialog categories={categories} defaultDate={today} onAdd={onAdd} />
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="card-pop p-8 text-center">
            <p className="font-display text-xl">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a task to your till.
            </p>
          </div>
        )}
        {visible.map((task) => (
          <div
            key={task.id}
            className={cn(
              "card-pop flex items-center gap-3 p-4 transition-opacity",
              task.done && "opacity-70",
            )}
          >
            <button
              type="button"
              aria-label={task.done ? "Mark incomplete" : "Complete task"}
              onClick={(e) => handleToggle(task, e.currentTarget)}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border-2 border-foreground transition-transform active:scale-90",
                task.done ? "bg-accent text-accent-foreground" : "bg-transparent",
              )}
            >
              <Check className={cn("size-5", !task.done && "opacity-25")} />
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold", task.done && "line-through")}>
                {task.title}
              </p>
              {task.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
              )}
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                  categoryStyle(task.category).chip,
                )}
              >
                {task.category}
              </span>
            </div>
            <button
              type="button"
              aria-label="Edit task"
              onClick={() => setEditing(task)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Delete task"
              onClick={() => onRemove(task.id)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <EditTaskDialog categories={categories} task={editing} onClose={() => setEditing(null)} onSave={onUpdate} />
    </div>
  );
}
