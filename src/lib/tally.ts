import { useCallback, useEffect, useState } from "react";

/** A category is just its user-created name; the list lives in the database. */
export type Category = string;

export type Task = {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD (day the task belongs to)
  description: string | null;
  done: boolean;
  completedAt: string | null;
};

type CategoryStyle = { chip: string; dot: string; chart: string };

/** Pickable category colors. Each chip pairs a palette background with readable text in both modes. */
export const CATEGORY_COLORS: (CategoryStyle & { hex: string; label: string })[] = [
  { hex: "#DBC0E8", label: "Lavender", chip: "bg-lavender text-night", dot: "bg-lavender", chart: "var(--lavender)" },
  { hex: "#A3C1E2", label: "Skies", chip: "bg-skies text-night", dot: "bg-skies", chart: "var(--skies)" },
  { hex: "#FBB28B", label: "Peaches", chip: "bg-peaches text-night", dot: "bg-peaches", chart: "var(--peaches)" },
  { hex: "#F76F54", label: "Poppy", chip: "bg-poppy text-night", dot: "bg-poppy", chart: "var(--poppy)" },
  { hex: "#EA5E86", label: "Fuchsia", chip: "bg-fuchsia text-night", dot: "bg-fuchsia", chart: "var(--fuchsia)" },
  { hex: "#47B5A8", label: "Pool", chip: "bg-pool text-night", dot: "bg-pool", chart: "var(--pool)" },
  { hex: "#F9A2C5", label: "Cotton candy", chip: "bg-cotton text-night", dot: "bg-cotton", chart: "var(--cotton)" },
  { hex: "#6B515E", label: "Eggplant", chip: "bg-eggplant text-daffodil", dot: "bg-eggplant", chart: "var(--eggplant)" },
  { hex: "#B79A65", label: "Hay", chip: "bg-hay text-night", dot: "bg-hay", chart: "var(--hay)" },
];

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0]!.hex;

const PALETTE: CategoryStyle[] = CATEGORY_COLORS;

const FALLBACK: CategoryStyle = {
  chip: "bg-muted text-muted-foreground",
  dot: "bg-muted",
  chart: "var(--muted)",
};

/** name -> saved hex, kept in sync by useCategories so every view shows the chosen color. */
const colorByName = new Map<string, string>();

export function registerCategoryColors(entries: { name: string; color: string | null }[]) {
  colorByName.clear();
  for (const e of entries) {
    if (e.color) colorByName.set(e.name.toLowerCase(), e.color.toLowerCase());
  }
}

export function styleForHex(hex: string | null | undefined): CategoryStyle | undefined {
  if (!hex) return undefined;
  return CATEGORY_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
}

/** The user's chosen color when set, otherwise a stable color derived from the name. */
export function categoryStyle(name: Category | null | undefined): CategoryStyle {
  if (!name) return FALLBACK;
  const chosen = styleForHex(colorByName.get(name.toLowerCase()));
  if (chosen) return chosen;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  return PALETTE[hash % PALETTE.length] ?? FALLBACK;
}


export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** "Aug 21, 2026" */
export function formatDay(key: string) {
  return fromKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


const STORAGE_KEY = "task-tallier.tasks.v1";

function load(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed
      .map((item) => {
        const src = item as Task;
        const t = { ...src, description: src.description ?? null } as Task;
        if ((t.category as string) === "School Misc") {
          return { ...t, category: "School" } as Task;
        }
        return t;
      })
      .filter((t) => t.title && t.date);
  } catch {
    return [];
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const addTask = useCallback(
    (title: string, category: Category, date: string, description?: string | null) => {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        category,
        date,
        description: description?.trim() ? description.trim().slice(0, 100) : null,
        done: false,
        completedAt: null,
      },
    ]);
    },
    [],
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: t.done ? null : new Date().toISOString() }
          : t,
      ),
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, "title" | "category" | "date" | "description">>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [],
  );

  return { tasks, hydrated, addTask, toggleTask, removeTask, updateTask };
}

export function countsByDay(tasks: Task[]) {
  const map = new Map<string, number>();
  for (const t of tasks) {
    if (!t.done) continue;
    map.set(t.date, (map.get(t.date) ?? 0) + 1);
  }
  return map;
}

export function bestRecord(tasks: Task[], excludeDate?: string) {
  let best = 0;
  let bestDate: string | null = null;
  for (const [date, count] of countsByDay(tasks)) {
    if (date === excludeDate) continue;
    if (count > best) {
      best = count;
      bestDate = date;
    }
  }
  return { best, bestDate };
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("task-tallier.theme");
    const initial =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("task-tallier.theme", theme);
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export async function fireConfetti(x: number, y: number) {
  if (typeof document === "undefined") return;
  const confetti = (await import("canvas-confetti")).default;
  const origin = {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
  };
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 35,
    scalar: 0.9,
    origin,
  });
}

