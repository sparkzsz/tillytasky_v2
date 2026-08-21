import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import {
  CATEGORY_STYLE,
  fireConfetti,
  fromKey,
  toKey,
  type Category,
  type Task,
} from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  onAdd: (title: string, category: Category, date: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: { title: string; category: Category; date: string }) => void;
};

type SortKey = "date" | "title" | "category" | "done";

export function TaskTable({ tasks, onAdd, onToggle, onRemove, onUpdate }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [editing, setEditing] = useState<Task | null>(null);
  const today = toKey(new Date());

  const rows = useMemo(() => {
    const base = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);
    const { key, dir } = sort;
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (key === "done") cmp = Number(a.done) - Number(b.done);
      else cmp = String(a[key]).localeCompare(String(b[key]));
      return cmp * dir;
    });
  }, [tasks, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  const columns: { key: SortKey; label: string; className: string }[] = [
    { key: "done", label: "Done", className: "w-16" },
    { key: "title", label: "Task", className: "" },
    { key: "category", label: "Category", className: "w-32" },
    { key: "date", label: "Date", className: "w-28" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CategoryFilter active={filter} onChange={setFilter} />
        <AddTaskDialog defaultDate={today} onAdd={onAdd} />
      </div>

      <div className="card-pop overflow-x-auto p-0">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              {columns.map((c) => (
                <th key={c.key} className={cn("p-3 text-left", c.className)}>
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className="inline-flex items-center gap-1 font-display text-xs uppercase tracking-wide"
                  >
                    {c.label}
                    {sort.key === c.key &&
                      (sort.dir === 1 ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      ))}
                  </button>
                </th>
              ))}
              <th className="w-24 p-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No tasks in your till yet.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <button
                    type="button"
                    aria-label={t.done ? "Mark incomplete" : "Complete task"}
                    onClick={() => {
                      onToggle(t.id);
                      if (!t.done) fireConfetti();
                    }}
                    className={cn(
                      "grid size-7 place-items-center rounded-full border-2 border-foreground transition-transform active:scale-90",
                      t.done ? "bg-accent text-accent-foreground" : "bg-transparent",
                    )}
                  >
                    <Check className={cn("size-4", !t.done && "opacity-25")} />
                  </button>
                </td>
                <td className={cn("p-3 font-semibold", t.done && "line-through opacity-70")}>
                  {t.title}
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                      CATEGORY_STYLE[t.category].chip,
                    )}
                  >
                    {t.category}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {fromKey(t.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="p-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Task actions"
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-2 border-foreground">
                      <DropdownMenuItem onClick={() => setEditing(t)}>
                        <Pencil className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAdd(t.title, t.category, t.date)}>
                        <Copy className="mr-2 size-4" /> Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    type="button"
                    aria-label="Delete task"
                    onClick={() => onRemove(t.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditTaskDialog task={editing} onClose={() => setEditing(null)} onSave={onUpdate} />
    </div>
  );
}
