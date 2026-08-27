import { useCallback, useEffect, useState } from "react";

import { supabase } from "./supabase";

export const MAX_CATEGORIES = 15;

export type UserCategory = {
  id: string;
  name: string;
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
    }))
    .filter((c) => c.id && c.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Reads and writes the user's own rows in the existing public.categories table.
 * RLS scopes every request to the signed-in user; no schema or policy changes.
 */
export function useCategories(sessionUserId: string | undefined) {
  const [state, setState] = useState<State>({ categories: [], loading: true, error: null });

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
    setState({
      categories: normalize((data ?? []) as Record<string, unknown>[]),
      loading: false,
      error: null,
    });
  }, [sessionUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const exists = useCallback(
    (name: string, ignoreId?: string) =>
      state.categories.some(
        (c) => c.id !== ignoreId && c.name.toLowerCase() === name.trim().toLowerCase(),
      ),
    [state.categories],
  );

  const create = useCallback(
    async (rawName: string): Promise<string | null> => {
      const name = rawName.trim();
      if (!supabase) return "Categories are not configured yet.";
      if (!name) return "Give the category a name.";
      if (name.length > 40) return "Keep the name under 40 characters.";
      if (exists(name)) return "You already have a category with that name.";
      if (state.categories.length >= MAX_CATEGORIES)
        return `You can have at most ${MAX_CATEGORIES} categories.`;

      let { error } = await supabase.from("categories").insert({ name, user_id: sessionUserId });
      if (error && /user_id/i.test(error.message)) {
        ({ error } = await supabase.from("categories").insert({ name }));
      }
      if (error) return error.message;
      await refresh();
      return null;
    },
    [exists, refresh, sessionUserId, state.categories.length],
  );

  const update = useCallback(
    async (id: string, rawName: string): Promise<string | null> => {
      const name = rawName.trim();
      if (!supabase) return "Categories are not configured yet.";
      if (!name) return "Give the category a name.";
      if (exists(name, id)) return "You already have a category with that name.";
      const { error } = await supabase.from("categories").update({ name }).eq("id", id);
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

  return {
    categories: state.categories,
    names: state.categories.map((c) => c.name),
    loading: state.loading,
    error: state.error,
    atLimit: state.categories.length >= MAX_CATEGORIES,
    refresh,
    create,
    update,
    remove,
  };
}
