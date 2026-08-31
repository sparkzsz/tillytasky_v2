import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "./supabase";
import { DEFAULT_CATEGORY_COLOR, registerCategoryColors } from "./tally";

export const MAX_CATEGORIES = 15;

const ORDER_KEY = "tillytasky.category-order.v1";

function loadOrder(userId: string | undefined): string[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(`${ORDER_KEY}.${userId}`);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveOrder(userId: string | undefined, ids: string[]) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(`${ORDER_KEY}.${userId}`, JSON.stringify(ids));
}

const SEEDED_KEY = "tillytasky.category-order-seeded.v1";

function alreadySeeded(userId: string | undefined) {
  if (typeof window === "undefined" || !userId) return true;
  return window.localStorage.getItem(`${SEEDED_KEY}.${userId}`) === "1";
}

function markSeeded(userId: string | undefined) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(`${SEEDED_KEY}.${userId}`, "1");
}

export type UserCategory = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number | null;
};

type State = {
  categories: UserCategory[];
  loading: boolean;
  error: string | null;
};

function normalize(rows: Record<string, unknown>[]): UserCategory[] {
  return rows
    .map((r) => ({
      id: String(r['id'] ?? r['category_id'] ?? ""),
      name: String(r['name'] ?? r['title'] ?? r['category'] ?? "").trim(),
      color: r['color'] ? String(r['color']) : null,
      sortOrder:
        r['sort_order'] === null || r['sort_order'] === undefined
          ? null
          : Number(r['sort_order']),
    }))
    .filter((c) => c.id && c.name)
    .sort((a, b) => {
      const ra = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const rb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Reads and writes the user's own rows in the existing public.categories table.
 * RLS scopes every request to the signed-in user; no schema or policy changes.
 */
export function useCategories(sessionUserId: string | undefined) {
  const [state, setState] = useState<State>({ categories: [], loading: true, error: null });
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    setOrder(loadOrder(sessionUserId));
  }, [sessionUserId]);

  /** Saved sort_order wins; a legacy local order is used until it is seeded to the server. */
  const ordered = useMemo(() => {
    const local = new Map(order.map((id, i) => [id, i]));
    const hasServerOrder = state.categories.some((c) => c.sortOrder !== null);
    return [...state.categories].sort((a, b) => {
      const ra = hasServerOrder
        ? (a.sortOrder ?? Number.MAX_SAFE_INTEGER)
        : (local.get(a.id) ?? Number.MAX_SAFE_INTEGER);
      const rb = hasServerOrder
        ? (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
        : (local.get(b.id) ?? Number.MAX_SAFE_INTEGER);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [state.categories, order]);

  const refresh = useCallback(async () => {
    if (!supabase || !sessionUserId) {
      setState({ categories: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      setState({ categories: [], loading: false, error: error.message });
      return;
    }
    const categories = normalize((data ?? []) as Record<string, unknown>[]);
    registerCategoryColors(categories);
    setState({ categories, loading: false, error: null });
  }, [sessionUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** One-time push of a device-local order up to the database. */
  useEffect(() => {
    if (state.loading || state.error || !sessionUserId || state.categories.length === 0) return;
    if (alreadySeeded(sessionUserId)) return;
    if (state.categories.some((c) => c.sortOrder !== null)) {
      markSeeded(sessionUserId);
      return;
    }
    const local = loadOrder(sessionUserId);
    if (local.length === 0) return;
    void reorder(ordered.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading, state.error, state.categories, sessionUserId]);

  const exists = useCallback(
    (name: string, ignoreId?: string) =>
      state.categories.some(
        (c) => c.id !== ignoreId && c.name.toLowerCase() === name.trim().toLowerCase(),
      ),
    [state.categories],
  );

  const create = useCallback(
    async (rawName: string, color?: string | null): Promise<string | null> => {
      const name = rawName.trim();
      if (!supabase) return "Categories are not configured yet.";
      if (!name) return "Give the category a name.";
      if (name.length > 40) return "Keep the name under 40 characters.";
      if (exists(name)) return "You already have a category with that name.";
      if (state.categories.length >= MAX_CATEGORIES)
        return `You can have at most ${MAX_CATEGORIES} categories.`;

      const row = { name, color: color ?? DEFAULT_CATEGORY_COLOR };
      let { error } = await supabase
        .from("categories")
        .insert({ ...row, user_id: sessionUserId });
      if (error && /user_id/i.test(error.message)) {
        ({ error } = await supabase.from("categories").insert(row));
      }
      if (error) return error.message;
      await refresh();
      return null;
    },
    [exists, refresh, sessionUserId, state.categories.length],
  );

  const update = useCallback(
    async (id: string, rawName: string, color?: string | null): Promise<string | null> => {
      const name = rawName.trim();
      if (!supabase) return "Categories are not configured yet.";
      if (!name) return "Give the category a name.";
      if (exists(name, id)) return "You already have a category with that name.";
      const patch: { name: string; color?: string } = { name };
      if (color) patch.color = color;
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) return error.message;
      await refresh();
      return null;
    },
    [exists, refresh],
  );


  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      if (!supabase) return "Categories are not configured yet.";
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) return error.message;
      await refresh();
      return null;
    },
    [refresh],
  );

  /** Persists an explicit display order (drag and drop) to the database. */
  const reorder = useCallback(
    async (ids: string[]) => {
      saveOrder(sessionUserId, ids);
      setOrder(ids);
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) => {
          const i = ids.indexOf(c.id);
          return i < 0 ? c : { ...c, sortOrder: i };
        }),
      }));
      if (!supabase) return;
      await Promise.all(
        ids.map((id, i) => supabase!.from("categories").update({ sort_order: i }).eq("id", id)),
      );
      markSeeded(sessionUserId);
    },
    [sessionUserId],
  );

  /** Moves a category up (-1) or down (+1) in the user's display order. */
  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const ids = ordered.map((c) => c.id);
      const from = ids.indexOf(id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= ids.length) return;
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      reorder(next);
    },
    [ordered, reorder],
  );

  return {
    categories: ordered,
    names: ordered.map((c) => c.name),
    loading: state.loading,
    error: state.error,
    atLimit: state.categories.length >= MAX_CATEGORIES,
    refresh,
    create,
    update,
    remove,
    move,
    reorder,
  };
}
