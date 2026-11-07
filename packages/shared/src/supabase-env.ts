/**
 * Supabase project URL and API keys.
 *
 * Prefer the new key names (publishable / secret). Legacy anon and service_role
 * names still work as fallbacks so older .env files and host secrets keep running.
 *
 * Access env vars with static property names so Next.js can inline NEXT_PUBLIC_*
 * into the browser bundle. Never log these values. The secret key is server-only:
 * do not import getSupabaseSecretKey from a Client Component, and never prefix
 * it with NEXT_PUBLIC_.
 */
function trim(value: string | undefined) {
  return (value ?? "").trim();
}

export function getSupabaseUrl() {
  return trim(process.env.NEXT_PUBLIC_SUPABASE_URL) || trim(process.env.SUPABASE_URL);
}

/** Publishable key, or the legacy anon key. Safe to use in the browser (RLS applies). */
export function getSupabasePublishableKey() {
  return (
    trim(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    trim(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    trim(process.env.SUPABASE_ANON_KEY)
  );
}

/**
 * Secret key, or the legacy service_role key. Bypasses RLS. Server-only.
 * Import this from apps/api (or other trusted server code), never from the browser.
 */
export function getSupabaseSecretKey() {
  return trim(process.env.SUPABASE_SECRET_KEY) || trim(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasSupabasePublicConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function hasSupabaseSecretConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}
