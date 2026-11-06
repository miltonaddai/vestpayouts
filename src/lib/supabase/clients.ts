import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type TypedClient = SupabaseClient<Database>;

/** Cache tag attached to every public read, so /api/revalidate and /admin can refresh pages. */
export const PAYOUTS_TAG = "payouts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const isServiceRoleConfigured = Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY);

let publicClient: TypedClient | null = null;

/**
 * Anon-key client for public reads (subject to RLS). Requests are tagged for Next's data
 * cache so ISR pages stay static between revalidations.
 */
export function getPublicClient(): TypedClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  publicClient ??= createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 3600, tags: [PAYOUTS_TAG] } } as RequestInit),
    },
  });
  return publicClient;
}

/**
 * Service-role client: bypasses RLS. Only use on the server (ingester, import script,
 * /go click logging, /admin server actions). The key is never exposed to the browser
 * because it has no NEXT_PUBLIC_ prefix.
 */
export function getServiceClient(): TypedClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to write to Supabase");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
