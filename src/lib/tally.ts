import { useCallback, useEffect, useState } from "react";

export const CATEGORIES = [
  "I 320U",
  "I 372",
  "I 320D",
  "ADV 373",
  "Job Applied",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Task = {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD (day the task belongs to)
  done: boolean;
  completedAt: string | null;
};

export const CATEGORY_STYLE: Record<Category, { chip: string; dot: string; chart: string }> = {
  "I 320U": { chip: "bg-tomato text-background", dot: "bg-tomato", chart: "var(--tomato)" },
  "I 372": { chip: "bg-bali text-background", dot: "bg-bali", chart: "var(--bali)" },
  "I 320D": { chip: "bg-tang text-foreground", dot: "bg-tang", chart: "var(--tang)" },
  "ADV 373": { chip: "bg-blush text-background", dot: "bg-blush", chart: "var(--blush)" },
  "Job Applied": { chip: "bg-bahamas text-background", dot: "bg-bahamas", chart: "var(--bahamas)" },
};

export function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const STORAGE_KEY = "task-tallier.tasks.v1";

function load(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
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

  return { tasks, hydrated, addTask, toggleTask, removeTask };
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
    const colors = ["#EF6545", "#F49625", "#F7E9B2", "#037F71", "#EA5E86", "#57B1A8"];
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors });
    setTimeout(
      () => confetti({ particleCount: 60, spread: 110, origin: { y: 0.6 }, colors, startVelocity: 35 }),
      150,
    );
  });
}
