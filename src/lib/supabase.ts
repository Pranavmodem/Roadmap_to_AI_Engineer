import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Publishable values only — safe in the browser; Row Level Security guards
// every table. Defaults point at the shared LearnMe project (same accounts as
// eli5code.com); override via env for a different Supabase project, or set
// both to empty strings to force local-only mode.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kcnjvsdgzvvswsadcibw.supabase.co";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_LItpZ8EN5YgExO8t5u7A1A_mXzJLIip";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}

/** True when Supabase is configured — gates all auth UI. */
export const authEnabled = Boolean(url && anonKey);

export interface Profile {
  id: string;
  username: string;
  role: string | null;
  experience: string | null;
  goal: string | null;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("id, username, role, experience, goal")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.warn("Profile fetch failed:", error.message);
    return null;
  }
  return data;
}

export async function isUsernameAvailable(name: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  const { data, error } = await sb.rpc("username_available", { name });
  if (error) {
    console.warn("Username check failed:", error.message);
    return true; // the signup trigger resolves races server-side
  }
  return Boolean(data);
}

/** Resolve a username to its login email (username + password sign-in). */
export async function getLoginEmail(name: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc("get_login_email", { name });
  if (error || !data) return null;
  return data as string;
}

/**
 * The synced learner state — one JSONB blob per user, merged client-side so
 * schema evolution never needs a migration. Shape mirrors the zustand store's
 * persisted slice (see src/lib/store.ts).
 */
export interface SyncedState {
  completedDays: string[];
  quizScores: Record<string, unknown>;
  srs: Record<string, unknown>;
  notes: Record<string, string>;
  bookmarks: string[];
  snippets: unknown[];
  projectChecks: Record<string, number[]>;
  activityDates: string[];
  startDate: string | null;
  mode: string;
}

export async function fetchUserState(userId: string): Promise<SyncedState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("user_progress")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("Progress fetch failed:", error.message);
    return null;
  }
  return (data?.state as SyncedState) ?? null;
}

export async function pushUserState(userId: string, state: SyncedState): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("user_progress").upsert(
    { user_id: userId, state, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) console.warn("Progress sync failed:", error.message);
}
