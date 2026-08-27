import { useCallback, useEffect, useState } from "react";

/** A category is just its user-created name; the list lives in the database. */
export type Category = string;

export type Task = {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD (day the task belongs to)
  done: boolean;
  completedAt: string | null;
};

type CategoryStyle = { chip: string; dot: string; chart: string };

const PALETTE: CategoryStyle[] = [
  { chip: "bg-poppy text-night", dot: "bg-poppy", chart: "var(--poppy)" },
  { chip: "bg-pool text-night", dot: "bg-pool", chart: "var(--pool)" },
  { chip: "bg-skies text-night", dot: "bg-skies", chart: "var(--skies)" },
  { chip: "bg-fuchsia text-night", dot: "bg-fuchsia", chart: "var(--fuchsia)" },
  { chip: "bg-hay text-night", dot: "bg-hay", chart: "var(--hay)" },
  { chip: "bg-lavender text-night", dot: "bg-lavender", chart: "var(--lavender)" },
  { chip: "bg-cotton text-night", dot: "bg-cotton", chart: "var(--cotton)" },
  { chip: "bg-sage text-night", dot: "bg-sage", chart: "var(--sage)" },
  { chip: "bg-peaches text-night", dot: "bg-peaches", chart: "var(--peaches)" },
  { chip: "bg-eggplant text-daffodil", dot: "bg-eggplant", chart: "var(--eggplant)" },
];

const FALLBACK: CategoryStyle = {
  chip: "bg-muted text-muted-foreground",
  dot: "bg-muted",
  chart: "var(--muted)",
};

/** Stable color per category name, so colors stay consistent across views. */
export function categoryStyle(name: Category | null | undefined): CategoryStyle {
  if (!name) return FALLBACK;
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

const STORAGE_KEY = "task-tallier.tasks.v1";

function load(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed
      .map((item) => {
        const t = item as Task;
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

  const addTask = useCallback((title: string, category: Category, date: string) => {
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        category,
        date,
        done: false,
        completedAt: null,
      },
    ]);
  }, []);

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
    (id: string, patch: Partial<Pick<Task, "title" | "category" | "date">>) => {
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

export function fireConfetti() {
  void import("canvas-confetti").then(({ default: confetti }) => {
    const colors = ["#F76F54", "#FBB28B", "#F7E289", "#47B5A8", "#EA5E86", "#DBC0E8", "#A3C1E2"];
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors });
    setTimeout(
      () => confetti({ particleCount: 60, spread: 110, origin: { y: 0.6 }, colors, startVelocity: 35 }),
      150,
    );
  });
}
