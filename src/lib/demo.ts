import { useCallback, useEffect, useMemo, useState } from "react";

import type { UserCategory } from "./categories";
import { MAX_CATEGORIES } from "./categories";
import {
  registerCategoryColors,
  toKey,
  type Category,
  type LogoVariant,
  type Task,
} from "./tally";

/**
 * Demo Mode data layer.
 *
 * Everything here lives in localStorage under the `tillytasky.demo.*` namespace.
 * It never touches Supabase, never signs anyone in, and never reads or writes
 * the per-user keys used by authenticated accounts.
 */
export const DEMO_TASKS_KEY = "tillytasky.demo.tasks.v1";
export const DEMO_CATEGORIES_KEY = "tillytasky.demo.categories.v1";
export const DEMO_PROFILE_KEY = "tillytasky.demo.profile.v1";

const DEMO_KEYS = [DEMO_TASKS_KEY, DEMO_CATEGORIES_KEY, DEMO_PROFILE_KEY];

/** Wipes the demo session so a later visit starts from the sample data again. */
export function clearDemoData() {
  if (typeof window === "undefined") return;
  for (const key of DEMO_KEYS) window.localStorage.removeItem(key);
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function shiftDay(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toKey(d);
}

function id() {
  return crypto.randomUUID();
}

const SEED_CATEGORY_DEFS: { name: string; color: string }[] = [
  { name: "School", color: "#A3C1E2" },
  { name: "Recruiting", color: "#F76F54" },
  { name: "Exercise", color: "#47B5A8" },
  { name: "Self-care", color: "#DBC0E8" },
  { name: "General", color: "#B79A65" },
];

function seedCategories(): UserCategory[] {
  return SEED_CATEGORY_DEFS.map((c, i) => ({
    id: id(),
    name: c.name,
    color: c.color,
    sortOrder: i,
  }));
}

type SeedTask = {
  title: string;
  category: string;
  offset: number;
  done?: boolean;
  important?: boolean;
  description?: string;
};

const SEED_TASKS: SeedTask[] = [
  // Past two weeks — builds the calendar, the record, and the chart.
  { title: "Read chapter 4 notes", category: "School", offset: -13, done: true },
  { title: "Draft cover letter", category: "Recruiting", offset: -13, done: true },
  { title: "Morning run", category: "Exercise", offset: -12, done: true },
  { title: "Group project outline", category: "School", offset: -12, done: true },
  { title: "Tidy desk", category: "General", offset: -12, done: true },
  { title: "Stretch session", category: "Self-care", offset: -11, done: true },
  { title: "Apply — product intern", category: "Recruiting", offset: -11, done: true },
  { title: "Reading response", category: "School", offset: -10, done: true },
  { title: "Meal prep", category: "General", offset: -10, done: true },
  { title: "Lift day", category: "Exercise", offset: -9, done: true },
  { title: "Portfolio case study", category: "Recruiting", offset: -9, done: true, important: true },
  { title: "Study for quiz", category: "School", offset: -8, done: true },
  { title: "Journal 10 minutes", category: "Self-care", offset: -8, done: true },
  { title: "Laundry", category: "General", offset: -8, done: true },
  { title: "Interview prep questions", category: "Recruiting", offset: -7, done: true },
  { title: "Long walk", category: "Exercise", offset: -7, done: true },
  { title: "Finish notes", category: "School", offset: -6, done: true },
  { title: "Water plants", category: "General", offset: -5, done: true },
  { title: "Yoga", category: "Exercise", offset: -4, done: true },
  { title: "Follow up with recruiter", category: "Recruiting", offset: -3, done: true },
  { title: "Outline final paper", category: "School", offset: -2, done: true, important: true },
  { title: "Screen-free evening", category: "Self-care", offset: -2, done: true },
  { title: "Inbox to zero", category: "General", offset: -1, done: true },
  { title: "Cardio", category: "Exercise", offset: -1, done: true },
  { title: "Peer review feedback", category: "School", offset: -1 },

  // Today — a live mix so Today's Till looks in-progress.
  {
    title: "Submit final paper",
    category: "School",
    offset: 0,
    important: true,
    description: "Upload the PDF and double-check the citations.",
  },
  { title: "Apply — design internship", category: "Recruiting", offset: 0, important: true },
  { title: "Lift day", category: "Exercise", offset: 0, done: true },
  { title: "Read 20 pages", category: "Self-care", offset: 0, done: true },
  { title: "Grocery run", category: "General", offset: 0 },
  { title: "Update portfolio site", category: "Recruiting", offset: 0, description: "Add the newest project." },

  // Upcoming — shows planning ahead.
  { title: "Study group", category: "School", offset: 1 },
  { title: "Mock interview", category: "Recruiting", offset: 1, important: true },
  { title: "Rest day walk", category: "Exercise", offset: 2 },
  { title: "Call home", category: "Self-care", offset: 2 },
  { title: "Plan next week", category: "General", offset: 3 },
];

function seedTasks(): Task[] {
  return SEED_TASKS.map((t) => {
    const date = shiftDay(t.offset);
    return {
      id: id(),
      title: t.title,
      category: t.category,
      date,
      description: t.description ?? null,
      important: t.important === true,
      done: t.done === true,
      completedAt: t.done ? `${date}T18:00:00.000Z` : null,
    } satisfies Task;
  });
}

/** True once the demo session has been seeded in this browser. */
export function hasDemoData() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_TASKS_KEY) !== null;
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(DEMO_CATEGORIES_KEY) === null) {
    write(DEMO_CATEGORIES_KEY, seedCategories());
  }
  if (window.localStorage.getItem(DEMO_TASKS_KEY) === null) {
    write(DEMO_TASKS_KEY, seedTasks());
  }
}

/** Same API surface as useCategories(), backed by localStorage. */
export function useDemoCategories() {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSeeded();
    const stored = read<UserCategory[]>(DEMO_CATEGORIES_KEY, []);
    registerCategoryColors(stored);
    setCategories(stored);
    setLoading(false);
  }, []);

  const persist = useCallback((next: UserCategory[]) => {
    registerCategoryColors(next);
    setCategories(next);
    write(DEMO_CATEGORIES_KEY, next);
  }, []);

  const ordered = useMemo(
    () =>
      [...categories].sort((a, b) => {
        const ra = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (ra !== rb) return ra - rb;
        return a.name.localeCompare(b.name);
      }),
    [categories],
  );

  const create = useCallback(
    async (rawName: string, color?: string | null): Promise<string | null> => {
      const name = rawName.trim();
      if (!name) return "Give the category a name.";
      if (name.length > 40) return "Keep the name under 40 characters.";
      if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase()))
        return "You already have a category with that name.";
      if (categories.length >= MAX_CATEGORIES)
        return `You can have at most ${MAX_CATEGORIES} categories.`;
      persist([
        ...categories,
        { id: id(), name, color: color ?? null, sortOrder: categories.length },
      ]);
      return null;
    },
    [categories, persist],
  );

  const update = useCallback(
    async (catId: string, rawName: string, color?: string | null): Promise<string | null> => {
      const name = rawName.trim();
      if (!name) return "Give the category a name.";
      if (categories.some((c) => c.id !== catId && c.name.toLowerCase() === name.toLowerCase()))
        return "You already have a category with that name.";
      const previous = categories.find((c) => c.id === catId);
      persist(
        categories.map((c) => (c.id === catId ? { ...c, name, color: color ?? c.color } : c)),
      );
      // Keep tasks pointing at the renamed category.
      if (previous && previous.name !== name) {
        const tasks = read<Task[]>(DEMO_TASKS_KEY, []);
        write(
          DEMO_TASKS_KEY,
          tasks.map((t) => (t.category === previous.name ? { ...t, category: name } : t)),
        );
        window.dispatchEvent(new Event("tillytasky-demo-tasks"));
      }
      return null;
    },
    [categories, persist],
  );

  const remove = useCallback(
    async (catId: string): Promise<string | null> => {
      persist(categories.filter((c) => c.id !== catId));
      return null;
    },
    [categories, persist],
  );

  const reorder = useCallback(
    async (ids: string[]) => {
      persist(
        categories.map((c) => {
          const i = ids.indexOf(c.id);
          return i < 0 ? c : { ...c, sortOrder: i };
        }),
      );
    },
    [categories, persist],
  );

  const move = useCallback(
    (catId: string, dir: -1 | 1) => {
      const ids = ordered.map((c) => c.id);
      const from = ids.indexOf(catId);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= ids.length) return;
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      void reorder(next);
    },
    [ordered, reorder],
  );

  const refresh = useCallback(async () => {
    const stored = read<UserCategory[]>(DEMO_CATEGORIES_KEY, []);
    registerCategoryColors(stored);
    setCategories(stored);
  }, []);

  return {
    categories: ordered,
    names: ordered.map((c) => c.name),
    loading,
    error: null as string | null,
    atLimit: categories.length >= MAX_CATEGORIES,
    refresh,
    create,
    update,
    remove,
    move,
    reorder,
  };
}

/** Same API surface as useTasks(), backed by localStorage. */
export function useDemoTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    ensureSeeded();
    setTasks(read<Task[]>(DEMO_TASKS_KEY, []));
    setHydrated(true);
    const onExternal = () => setTasks(read<Task[]>(DEMO_TASKS_KEY, []));
    window.addEventListener("tillytasky-demo-tasks", onExternal);
    return () => window.removeEventListener("tillytasky-demo-tasks", onExternal);
  }, []);

  const persist = useCallback((next: Task[]) => {
    setTasks(next);
    write(DEMO_TASKS_KEY, next);
  }, []);

  const addTask = useCallback(
    (
      title: string,
      category: Category,
      date: string,
      description?: string | null,
      important?: boolean,
    ) => {
      persist([
        ...tasks,
        {
          id: id(),
          title,
          category,
          date,
          description: description?.trim() ? description.trim().slice(0, 100) : null,
          important: important === true,
          done: false,
          completedAt: null,
        },
      ]);
    },
    [tasks, persist],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      persist(
        tasks.map((t) =>
          t.id === taskId
            ? { ...t, done: !t.done, completedAt: t.done ? null : new Date().toISOString() }
            : t,
        ),
      );
    },
    [tasks, persist],
  );

  const removeTask = useCallback(
    (taskId: string) => persist(tasks.filter((t) => t.id !== taskId)),
    [tasks, persist],
  );

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<Pick<Task, "title" | "category" | "date" | "description" | "important">>,
    ) => persist(tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t))),
    [tasks, persist],
  );

  const clearTasks = useCallback(() => persist([]), [persist]);

  const moveTasksToDate = useCallback(
    (ids: string[], date: string) => {
      const set = new Set(ids);
      persist(tasks.map((t) => (set.has(t.id) ? { ...t, date } : t)));
    },
    [tasks, persist],
  );

  const refresh = useCallback(async () => {
    setTasks(read<Task[]>(DEMO_TASKS_KEY, []));
  }, []);

  return {
    tasks,
    hydrated,
    refresh,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    clearTasks,
    moveTasksToDate,
  };
}

type DemoProfile = { displayName: string; logo: LogoVariant };

/** Display name + till color for the demo session. */
export function useDemoProfile() {
  const [profile, setProfile] = useState<DemoProfile>({ displayName: "", logo: "default" });

  useEffect(() => {
    setProfile(read<DemoProfile>(DEMO_PROFILE_KEY, { displayName: "", logo: "default" }));
  }, []);

  const save = useCallback((next: DemoProfile) => {
    setProfile(next);
    write(DEMO_PROFILE_KEY, next);
  }, []);

  return {
    displayName: profile.displayName,
    setDisplayName: (value: string) => save({ ...profile, displayName: value.trim().slice(0, 24) }),
    logo: profile.logo,
    setLogo: (logo: LogoVariant) => save({ ...profile, logo }),
  };
}
