import { useCallback, useEffect, useRef, useState } from "react";

/** A category is just its user-created name; the list lives in the database. */
export type Category = string;

export type Task = {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD (day the task belongs to)
  description: string | null;
  important: boolean;
  done: boolean;
  completedAt: string | null;
};

/** "❗️ Task" when marked important. */
export function displayTitle(task: Pick<Task, "title" | "important">) {
  return task.important ? `❗️ ${task.title}` : task.title;
}

/** Groups tasks by the user's category order, alphabetical by title inside each group. */
export function sortTasksByCategory(tasks: Task[], categoryOrder: Category[]) {
  const rank = new Map(categoryOrder.map((c, i) => [c.toLowerCase(), i]));
  return [...tasks].sort((a, b) => {
    const ra = rank.get(a.category.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.category.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

type CategoryStyle = { chip: string; dot: string; chart: string };

/** Pickable category colors. Each chip pairs a palette background with readable text in both modes. */
export const CATEGORY_COLORS: (CategoryStyle & { hex: string; label: string })[] = [
  { hex: "#DBC0E8", label: "Lavender", chip: "bg-lavender text-night", dot: "bg-lavender", chart: "var(--lavender)" },
  { hex: "#A3C1E2", label: "Skies", chip: "bg-skies text-night", dot: "bg-skies", chart: "var(--skies)" },
  { hex: "#FBB28B", label: "Peaches", chip: "bg-peaches text-night", dot: "bg-peaches", chart: "var(--peaches)" },
  { hex: "#F76F54", label: "Poppy", chip: "bg-poppy text-night", dot: "bg-poppy", chart: "var(--poppy)" },
  { hex: "#A9AF94", label: "Sage", chip: "bg-sage text-night", dot: "bg-sage", chart: "var(--sage)" },
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


/**
 * Stage 1 migration: tasks now live in public.tasks.
 * The old localStorage payload below is intentionally left untouched (read-only)
 * so Stage 2 can migrate it.
 */
export const LEGACY_TASKS_STORAGE_KEY = "task-tallier.tasks.v1";

/** Reads (never writes) the legacy localStorage tasks, for the Stage 2 migration. */
export function loadLegacyTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return parsed
      .map((item) => {
        const src = item as Task;
        const t = {
          ...src,
          description: src.description ?? null,
          important: src.important === true,
        } as Task;
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

type TaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  completed: boolean | null;
  due_date: string | null;
  completed_at: string | null;
  important: boolean | null;
  category_id: string | null;
};

/** "2026-08-30T00:00:00+00:00" | "2026-08-30 00:00:00+00" -> "2026-08-30" */
function dayFromTimestamp(value: string | null): string {
  if (!value) return toKey(new Date());
  return value.slice(0, 10);
}

function rowToTask(row: TaskRow, categoryNameById: Map<string, string>): Task {
  return {
    id: row.id,
    title: row.title ?? "",
    category: (row.category_id ? categoryNameById.get(row.category_id) : "") ?? "",
    date: dayFromTimestamp(row.due_date),
    description: row.description ?? null,
    important: row.important === true,
    done: row.completed === true,
    completedAt: row.completed_at ?? null,
  };
}

/**
 * Tasks are stored in public.tasks, scoped to the signed-in user.
 * The public API is unchanged so components keep working; writes are optimistic
 * and reconciled from Supabase.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const categoriesRef = useRef<{ byId: Map<string, string>; byName: Map<string, string> }>({
    byId: new Map(),
    byName: new Map(),
  });

  useEffect(() => {
    if (!supabase) {
      setHydrated(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user.id),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  /** Rebuilds the category name <-> id maps used to translate between the UI and the table. */
  const loadCategoryMaps = useCallback(async () => {
    if (!supabase || !userId) return categoriesRef.current;
    const { data, error } = await supabase.from("categories").select("id, name").eq("user_id", userId);
    if (error) {
      console.error("Failed to load categories for tasks:", error.message);
      return categoriesRef.current;
    }
    const byId = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const row of (data ?? []) as { id: string; name: string }[]) {
      byId.set(row.id, row.name);
      byName.set(row.name.toLowerCase(), row.id);
    }
    categoriesRef.current = { byId, byName };
    return categoriesRef.current;
  }, [userId]);

  const categoryIdFor = useCallback(
    async (name: Category | null | undefined) => {
      const key = name?.trim().toLowerCase();
      if (!key) return null;
      const hit = categoriesRef.current.byName.get(key);
      if (hit) return hit;
      const maps = await loadCategoryMaps();
      return maps.byName.get(key) ?? null;
    },
    [loadCategoryMaps],
  );

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setTasks([]);
      setHydrated(true);
      return;
    }
    const maps = await loadCategoryMaps();
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, completed, due_date, completed_at, important, category_id")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to load tasks:", error.message);
      setHydrated(true);
      return;
    }
    setTasks(((data ?? []) as TaskRow[]).map((row) => rowToTask(row, maps.byId)));
    setHydrated(true);
  }, [userId, loadCategoryMaps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTask = useCallback(
    (
      title: string,
      category: Category,
      date: string,
      description?: string | null,
      important?: boolean,
    ) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        category,
        date,
        description: description?.trim() ? description.trim().slice(0, 100) : null,
        important: important === true,
        done: false,
        completedAt: null,
      };
      setTasks((prev) => [...prev, task]);

      void (async () => {
        if (!supabase || !userId) return;
        const category_id = await categoryIdFor(category);
        const { error } = await supabase.from("tasks").insert({
          id: task.id,
          user_id: userId,
          category_id,
          title: task.title,
          description: task.description,
          completed: task.done,
          due_date: task.date,
          completed_at: task.completedAt,
          important: task.important,
        });
        if (error) {
          console.error("Failed to save task:", error.message);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }
      })();
    },
    [userId, categoryIdFor],
  );

  const toggleTask = useCallback(
    (id: string) => {
      let next: Task | undefined;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          next = { ...t, done: !t.done, completedAt: t.done ? null : new Date().toISOString() };
          return next;
        }),
      );

      void (async () => {
        if (!supabase || !userId || !next) return;
        const { error } = await supabase
          .from("tasks")
          .update({ completed: next.done, completed_at: next.completedAt })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) {
          console.error("Failed to update task:", error.message);
          void refresh();
        }
      })();
    },
    [userId, refresh],
  );

  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      void (async () => {
        if (!supabase || !userId) return;
        const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
        if (error) {
          console.error("Failed to delete task:", error.message);
          void refresh();
        }
      })();
    },
    [userId, refresh],
  );

  const updateTask = useCallback(
    (
      id: string,
      patch: Partial<Pick<Task, "title" | "category" | "date" | "description" | "important">>,
    ) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

      void (async () => {
        if (!supabase || !userId) return;
        const row: Record<string, unknown> = {};
        if (patch.title !== undefined) row['title'] = patch.title;
        if (patch.description !== undefined) row['description'] = patch.description;
        if (patch.important !== undefined) row['important'] = patch.important;
        if (patch.date !== undefined) row['due_date'] = patch.date;
        if (patch.category !== undefined) row['category_id'] = await categoryIdFor(patch.category);
        if (Object.keys(row).length === 0) return;
        const { error } = await supabase.from("tasks").update(row).eq("id", id).eq("user_id", userId);
        if (error) {
          console.error("Failed to update task:", error.message);
          void refresh();
        }
      })();
    },
    [userId, categoryIdFor, refresh],
  );

  const clearTasks = useCallback(() => {
    setTasks([]);
    void (async () => {
      if (!supabase || !userId) return;
      const { error } = await supabase.from("tasks").delete().eq("user_id", userId);
      if (error) {
        console.error("Failed to clear tasks:", error.message);
        void refresh();
      }
    })();
  }, [userId, refresh]);

  return { tasks, hydrated, refresh, addTask, toggleTask, removeTask, updateTask, clearTasks };
}

const DISPLAY_NAME_KEY = "tillytasky.display-name.v1";

/** Display name for the hero greeting, stored per user in the browser/Supabase. */
import { supabase } from "@/lib/supabase";

export function useDisplayName(userId: string | undefined) {
  const [displayName, setDisplayNameState] = useState("");

  useEffect(() => {
    if (!userId) {
      setDisplayNameState("");
      return;
    }

    const loadDisplayName = async () => {
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const name = (user?.user_metadata?.["display_name"] as string | undefined) ?? "";
      setDisplayNameState(name);
    };

    void loadDisplayName();
  }, [userId]);

  const setDisplayName = useCallback(async (value: string) => {
    const next = value.trim().slice(0, 24);

    setDisplayNameState(next);

    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: next,
      },
    });

    if (error) {
      console.error("Failed to save display name:", error);
    }
  }, []);

  return {
    displayName,
    setDisplayName,
  };
}

const LOGO_KEY = "tillytasky.logo.v1";

export type LogoVariant = "default" | "peach" | "pink" | "purple";

export const LOGO_OPTIONS: { value: LogoVariant; label: string; src: string }[] = [
  { value: "default", label: "Default", src: "/tillytasky_logo_default.png" },
  { value: "peach", label: "Peach", src: "/tillytasky_logo_peach.png" },
  { value: "pink", label: "Pink", src: "/tillytasky_logo_pink.png" },
  { value: "purple", label: "Purple", src: "/tillytasky_logo_purple.png" },
];

export function logoSrc(variant: LogoVariant) {
  return (LOGO_OPTIONS.find((o) => o.value === variant) ?? LOGO_OPTIONS[0]!).src;
}

/** Logo color choice, stored per user in the browser. */
export function useLogoVariant(userId: string | undefined) {
  const [logo, setLogoState] = useState<LogoVariant>("default");

  useEffect(() => {
    if (!userId) return;
    const stored = window.localStorage.getItem(`${LOGO_KEY}.${userId}`) as LogoVariant | null;
    setLogoState(stored && LOGO_OPTIONS.some((o) => o.value === stored) ? stored : "default");
  }, [userId]);

  const setLogo = useCallback(
    (value: LogoVariant) => {
      setLogoState(value);
      if (userId) window.localStorage.setItem(`${LOGO_KEY}.${userId}`, value);
    },
    [userId],
  );

  return { logo, setLogo, src: logoSrc(logo) };
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

