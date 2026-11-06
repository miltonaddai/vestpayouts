import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] != null) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

/** Service-role client for CLI scripts (env loaded from .env.local by the yarn scripts). */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (put them in .env.local).");
    process.exit(1);
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Ask the deployed site to refresh ISR pages after a data change (no-op if not configured). */
export async function triggerRevalidate() {
  const site = process.env.REVALIDATE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!site || !secret) return;
  try {
    const res = await fetch(`${site.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15_000),
    });
    console.log(`revalidate ${site}: HTTP ${res.status}`);
  } catch (err) {
    console.warn(`revalidate ${site} failed: ${(err as Error).message}`);
  }
}

export function argValue(flag: string) {
  const args = process.argv.slice(2);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

export const hasFlag = (flag: string) => process.argv.slice(2).includes(flag);
