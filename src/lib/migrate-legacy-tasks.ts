import { supabase } from "./supabase";
import { LEGACY_TASKS_STORAGE_KEY, loadLegacyTasks } from "./tally";

/** Per-user flag so the one-time import never runs twice. */
const MIGRATION_FLAG_KEY = "tillytasky.legacy-tasks-migrated.v1";
/** Where the legacy payload is archived after a successful import. */
const ARCHIVE_KEY = "task-tallier.tasks.v1.archived";

function flagKey(userId: string) {
  return `${MIGRATION_FLAG_KEY}.${userId}`;
}

export function hasMigratedLegacyTasks(userId: string) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(flagKey(userId)) === "done";
}

/**
 * One-time import of the legacy localStorage tasks into public.tasks for the
 * signed-in user. Idempotent: guarded by a per-user flag, and the legacy data is
 * only archived after Supabase confirms the insert.
 */
export async function migrateLegacyTasks(userId: string | undefined): Promise<number> {
  if (typeof window === "undefined" || !supabase || !userId) return 0;
  if (hasMigratedLegacyTasks(userId)) return 0;

  const legacy = loadLegacyTasks();
  if (legacy.length === 0) {
    // Nothing to import — still mark done so we stop checking.
    window.localStorage.setItem(flagKey(userId), "done");
    return 0;
  }

  // Resolve category names -> ids for this user only.
  const { data: catRows, error: catError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId);
  if (catError) {
    console.error("Legacy task migration: failed to load categories:", catError.message);
    return 0;
  }
  const idByName = new Map<string, string>();
  for (const row of (catRows ?? []) as { id: string; name: string }[]) {
    idByName.set(row.name.trim().toLowerCase(), row.id);
  }

  const rows = legacy.map((t) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    category_id: idByName.get(t.category?.trim().toLowerCase() ?? "") ?? null,
    title: t.title,
    description: t.description ?? null,
    completed: t.done === true,
    due_date: t.date,
    completed_at: t.completedAt ?? null,
    important: t.important === true,
  }));

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) {
    console.error("Legacy task migration failed:", error.message);
    return 0; // flag stays unset; legacy data untouched so we can retry
  }

  // Success: archive the legacy payload, then mark the migration complete.
  const raw = window.localStorage.getItem(LEGACY_TASKS_STORAGE_KEY);
  if (raw !== null) {
    window.localStorage.setItem(ARCHIVE_KEY, raw);
    window.localStorage.removeItem(LEGACY_TASKS_STORAGE_KEY);
  }
  window.localStorage.setItem(flagKey(userId), "done");
  return rows.length;
}
