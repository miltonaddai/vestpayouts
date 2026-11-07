import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, getSupabaseUrl, type ChainId, type Database } from "@vestpayouts/shared";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] != null) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile(path.join(here, "../.env"));
loadEnvFile(path.join(here, "../.env.local"));

export function supabaseUrl() {
  return getSupabaseUrl();
}

export function supabaseSecretKey() {
  return getSupabaseSecretKey();
}

export function serviceClient(): SupabaseClient<Database> {
  const url = supabaseUrl();
  const key = supabaseSecretKey();
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) on the API.");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function hasSupabaseWrite() {
  return Boolean(supabaseUrl() && supabaseSecretKey());
}

/** Prefer the local JSON store when Supabase is unset, or when INGEST_STORE=local. */
export function useLocalPayoutStore() {
  const pref = (process.env.INGEST_STORE || "").trim().toLowerCase();
  if (pref === "local") return true;
  if (pref === "supabase") return false;
  return !hasSupabaseWrite();
}

export function alchemyApiKey() {
  return (process.env.ALCHEMY_API_KEY || "").trim();
}

const ALCHEMY_HOST: Record<ChainId, string> = {
  base: "base-mainnet.g.alchemy.com",
  arbitrum: "arb-mainnet.g.alchemy.com",
};

const FALLBACK_RPC: Record<ChainId, string> = {
  base: "https://base-rpc.publicnode.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
};

/**
 * RPC URL for a chain: BASE_RPC_URL / ARBITRUM_RPC_URL if set, otherwise
 * Alchemy `https://<network>.g.alchemy.com/v2/<ALCHEMY_API_KEY>`, otherwise the public default.
 * Never log the returned value — it may embed the API key.
 */
export function rpcUrlFor(chain: ChainId) {
  const envName = chain === "base" ? "BASE_RPC_URL" : "ARBITRUM_RPC_URL";
  const explicit = (process.env[envName] || "").trim();
  if (explicit) return explicit;
  const key = alchemyApiKey();
  if (key) return `https://${ALCHEMY_HOST[chain]}/v2/${key}`;
  return FALLBACK_RPC[chain];
}

export function isAlchemyRpc(url: string) {
  return /alchemy\.com/i.test(url);
}

export function rpcProviderLabel(url: string) {
  if (isAlchemyRpc(url)) return "alchemy";
  try {
    return new URL(url).host;
  } catch {
    return "custom";
  }
}

export function ingestMaxRequests(override?: number) {
  if (override && override > 0) return Math.floor(override);
  const n = Number(process.env.INGEST_MAX_REQUESTS || 300);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300;
}

/** Ask the Next.js app to refresh ISR pages after a data change. */
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

export function argValue(argv: string[], flag: string) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

export const hasFlag = (argv: string[], flag: string) => argv.includes(flag);
