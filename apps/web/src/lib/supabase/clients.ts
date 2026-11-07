import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@vestpayouts/shared";

export type TypedClient = SupabaseClient<Database>;

/** Cache tag attached to every public read. The API asks /api/revalidate to expire it. */
export const PAYOUTS_TAG = "payouts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let publicClient: TypedClient | null = null;

/**
 * Anon-key client for public reads (subject to RLS). Requests are tagged for Next's data
 * cache so ISR pages stay static between revalidations. Writes go through apps/api.
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

/** Anon client without Next's Data Cache — for live API polls and realtime refreshes. */
export function getFreshPublicClient(): TypedClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
