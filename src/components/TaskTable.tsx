import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarIcon, Check, Copy, Pencil, Search, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import {
  categoryStyle,
  displayTitle,
  fireConfetti,
  formatDay,
  fromKey,
  toKey,
  type Category,
  type Task,
} from "@/lib/tally";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[];
  categories: Category[];
  onAdd: (
    title: string,
    category: Category,
    date: string,
    description?: string | null,
    important?: boolean,
  ) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    patch: {
      title: string;
      category: Category;
      date: string;
      description: string | null;
      important: boolean;
    },
  ) => void;
};

type SortKey = "date" | "title" | "category" | "done";

export function TaskTable({ tasks, categories, onAdd, onToggle, onRemove, onUpdate }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [editing, setEditing] = useState<Task | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const today = toKey(new Date());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);
    if (q) {
      base = base.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.date.includes(q) ||
          formatDay(t.date).toLowerCase().includes(q) ||
          fromKey(t.date)
            .toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
            .toLowerCase()
            .includes(q) ||
          fromKey(t.date)
            .toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "numeric" })
            .toLowerCase()
            .includes(q),
      );
    }

    const { key, dir } = sort;
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (key === "done") cmp = Number(a.done) - Number(b.done);
      else cmp = String(a[key]).localeCompare(String(b[key]));
      return cmp * dir;
    });
  }, [tasks, filter, sort, query]);

  const selectedSet = new Set(selected);
  const visibleSelected = rows.filter((t) => selectedSet.has(t.id)).length;
  const allSelected = rows.length > 0 && visibleSelected === rows.length;

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function deleteSelected() {
    selected.forEach((id) => onRemove(id));
    setSelected([]);
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
        <CategoryFilter categories={categories} active={filter} onChange={setFilter} />
        <AddTaskDialog categories={categories} defaultDate={today} onAdd={onAdd} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks or dates…"
            aria-label="Search tasks or dates"
            className="pl-9"
          />
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <Button
              variant="destructive"
              onClick={deleteSelected}
              className="gap-2 border-2 border-foreground font-display"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="card-pop overflow-x-auto p-0">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="w-10 p-3">
                <Checkbox
                  checked={allSelected}
                  aria-label="Select all tasks"
                  onCheckedChange={(v) =>
                    setSelected(v === true ? rows.map((t) => t.id) : [])
                  }
                />
              </th>
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
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  {query.trim() ? "No tasks match your search." : "No tasks in your till yet."}
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Checkbox
                    checked={selectedSet.has(t.id)}
                    aria-label={`Select ${t.title}`}
                    onCheckedChange={() => toggleSelected(t.id)}
                  />
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    aria-label={t.done ? "Mark incomplete" : "Complete task"}
                    onClick={(e) => {
                      onToggle(t.id);
                      if (!t.done) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                      }
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
                  {displayTitle(t)}
                  {t.description && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {t.description}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                      categoryStyle(t.category).chip,
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
                      <DropdownMenuItem onClick={() => onAdd(t.title, t.category, t.date, t.description, t.important)}>
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

      <EditTaskDialog categories={categories} task={editing} onClose={() => setEditing(null)} onSave={onUpdate} />
    </div>
  );
}
