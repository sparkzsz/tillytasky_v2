import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const anonKey = (import.meta.env['VITE_SUPABASE_ANON_KEY'] ??
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']) as string | undefined;

/** True when the browser has the public Supabase config it needs. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client (publishable/anon key only — never a service-role key).
 * Null when env vars are missing so the app can render a clear message instead of crashing.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
