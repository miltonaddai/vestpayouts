import "server-only";
import { cache } from "react";
import { getFreshPublicClient, getPublicClient, isSupabaseConfigured } from "@/lib/supabase/clients";
import type { PayoutRow } from "@/lib/supabase/database.types";
import type { ChainId } from "./chains";
import * as sample from "./sample-backend";
import type {
  ChainCoverage,
  LeaderboardRow,
  Payout,
  PayoutPage,
  PayoutQuery,
  Period,
  Summary,
  WalletProfile,
  WindowStats,
} from "./types";

export const PAGE_SIZE = 50;
const COLUMNS =
  "id, source, chain, tx_hash, log_index, block_number, wallet, amount_usd, paid_at, requested_at, trader_name, proof_url, note, wallet_label";

export const dataMode = isSupabaseConfigured ? "supabase" : "sample-local";

export { payoutRoute } from "./routes";

export function toPayout(r: PayoutRow): Payout {
  return {
    id: String(r.id),
    source: r.source,
    chain: r.chain,
    txHash: r.tx_hash,
    logIndex: r.log_index,
    block: r.block_number,
    paidAt: Date.parse(r.paid_at),
    requestedAt: r.requested_at ? Date.parse(r.requested_at) : null,
    wallet: r.wallet,
    walletLabel: r.wallet_label,
    amount: Number(r.amount_usd),
    trader: r.trader_name,
    proofUrl: r.proof_url,
    note: r.note,
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Supabase ${what} failed: ${res.error.message}`);
  return res.data as T;
}

function since(period: Period) {
  const ms = { "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, all: 0 }[period];
  return ms ? new Date(Date.now() - ms).toISOString() : null;
}

const db = () => getPublicClient();
const view = () => db().from("visible_payouts").select(COLUMNS);

type RawWindow = { amount: number; count: number; wallets: number; largest: PayoutRow | null };

export const getSummary = cache(async (): Promise<Summary> => {
  if (!isSupabaseConfigured) return sample.getSummary();
  const raw = must(await db().rpc("payout_summary"), "payout_summary") as unknown as {
    windows: Record<Period, RawWindow>;
    median_amount_30d: number | null;
    median_processing_hours_30d: number | null;
    by_chain: { chain: ChainId; amount: number; count: number }[];
    first_paid_at: string | null;
    synced_at: string | null;
    is_sample: boolean;
  };
  const win = (w?: RawWindow): WindowStats => ({
    amount: Number(w?.amount ?? 0),
    count: Number(w?.count ?? 0),
    wallets: Number(w?.wallets ?? 0),
    largest: w?.largest ? toPayout(w.largest) : null,
  });
  return {
    windows: { "24h": win(raw.windows?.["24h"]), "7d": win(raw.windows?.["7d"]), "30d": win(raw.windows?.["30d"]), all: win(raw.windows?.all) },
    medianAmount30d: raw.median_amount_30d,
    medianProcessingHours: raw.median_processing_hours_30d,
    byChain: raw.by_chain.map((c) => ({ ...c, amount: Number(c.amount), count: Number(c.count) })),
    firstPaidAt: raw.first_paid_at ? Date.parse(raw.first_paid_at) : null,
    syncedAt: raw.synced_at ? Date.parse(raw.synced_at) : null,
    isSample: raw.is_sample,
  };
});

export const getLatest = cache(async (n = 12): Promise<Payout[]> => {
  if (!isSupabaseConfigured) return sample.getLatest(n);
  return must(await view().order("paid_at", { ascending: false }).limit(n), "latest").map(toPayout);
});

export const getLargest = cache(async (n = 10, period: Period = "all"): Promise<Payout[]> => {
  if (!isSupabaseConfigured) return sample.getLargest(n, period);
  let q = view();
  const s = since(period);
  if (s) q = q.gte("paid_at", s);
  return must(await q.order("amount_usd", { ascending: false }).limit(n), "largest").map(toPayout);
});

/** Uncached latest rows for the landing Realtime tab (polling / Supabase changes). */
export async function getLatestLive(n = 12): Promise<Payout[]> {
  if (!isSupabaseConfigured) return sample.getLatest(n);
  return must(
    await getFreshPublicClient()
      .from("visible_payouts")
      .select(COLUMNS)
      .order("paid_at", { ascending: false })
      .limit(n),
    "latest-live",
  ).map(toPayout);
}

export const getDailySeries = cache(async (days = 30) => {
  if (!isSupabaseConfigured) return sample.getDailySeries(days);
  const rows = must(await db().rpc("payout_daily", { days }), "payout_daily");
  return rows.map((r) => ({ date: Date.parse(`${r.day}T00:00:00Z`), amount: Number(r.amount), count: Number(r.payouts) }));
});

export const getLeaderboard = cache(async (period: Period, limit = 50): Promise<LeaderboardRow[]> => {
  if (!isSupabaseConfigured) return sample.getLeaderboard(period, limit);
  const rows = must(await db().rpc("payout_leaderboard", { period, max_rows: limit }), "payout_leaderboard");
  return rows.map((r, i) => ({
    key: r.wallet ?? r.label ?? String(i),
    wallet: r.wallet,
    label: r.label,
    total: Number(r.total),
    count: Number(r.payouts),
    largest: Number(r.largest),
    lastPaidAt: Date.parse(r.last_paid_at),
  }));
});

/** PostgREST `or` filter values must not contain its own delimiters. */
const sanitizeSearch = (q: string) => q.replace(/[^a-zA-Z0-9@_.\- ]/g, "").slice(0, 66);

export async function queryPayouts(query: PayoutQuery): Promise<PayoutPage> {
  if (!isSupabaseConfigured) return sample.queryPayouts(query, PAGE_SIZE);
  const q = query.q ? sanitizeSearch(query.q.trim().toLowerCase()) : "";
  const period = query.period ?? "all";
  const totals = must(
    await db().rpc("payout_search_totals", {
      p_chain: query.chain ?? null,
      p_min: query.min ?? null,
      p_period: period,
      p_q: q || null,
    }),
    "payout_search_totals",
  )[0] ?? { payouts: 0, amount: 0 };
  const total = Number(totals.payouts);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page ?? 1), pages);

  let sel = view();
  if (query.chain) sel = sel.eq("chain", query.chain);
  if (query.min) sel = sel.gte("amount_usd", query.min);
  const s = since(period);
  if (s) sel = sel.gte("paid_at", s);
  if (q) sel = sel.or(`wallet.ilike.%${q}%,tx_hash.ilike.%${q}%,trader_name.ilike.%${q}%,wallet_label.ilike.%${q}%`);
  sel =
    query.sort === "largest"
      ? sel.order("amount_usd", { ascending: false }).order("id", { ascending: false })
      : sel.order("paid_at", { ascending: false }).order("id", { ascending: false });
  const from = (page - 1) * PAGE_SIZE;
  const rows = must(await sel.range(from, from + PAGE_SIZE - 1), "query payouts").map(toPayout);
  return { rows, total, sum: Number(totals.amount), page, pages };
}

export const getPayoutsAtRoute = cache(async (network: string, ref: string): Promise<Payout[] | null> => {
  if (!isSupabaseConfigured) return sample.getPayoutsAtRoute(network, ref);
  if (network === "base" || network === "arbitrum") {
    if (!/^0x[0-9a-fA-F]{64}$/.test(ref)) return null;
    const rows = must(
      await view().eq("source", "onchain").eq("chain", network).eq("tx_hash", ref.toLowerCase()).order("log_index"),
      "payout by tx",
    );
    return rows.length ? rows.map(toPayout) : null;
  }
  if ((network === "manual" || network === "sample") && /^\d+$/.test(ref)) {
    const rows = must(await view().eq("source", network).eq("id", Number(ref)), "payout by id");
    return rows.length ? rows.map(toPayout) : null;
  }
  return null;
});

export const getWallet = cache(async (address: string): Promise<WalletProfile | null> => {
  if (!isSupabaseConfigured) return null;
  const a = address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return null;
  const [rows, alias] = await Promise.all([
    view().eq("wallet", a).order("paid_at", { ascending: false }).limit(1000),
    db().from("wallets").select("display_name, x_handle").eq("address", a).maybeSingle(),
  ]);
  const payouts = must(rows, "wallet payouts").map(toPayout);
  if (!payouts.length) return null;
  const largest = payouts.reduce((m, p) => (p.amount > m.amount ? p : m), payouts[0]);
  return {
    address: a,
    label: alias.data?.display_name ?? null,
    xHandle: alias.data?.x_handle ?? null,
    payouts,
    amount: payouts.reduce((s, p) => s + p.amount, 0),
    count: payouts.length,
    largest,
  };
});

export const getPercentile = cache(async (amount: number) => {
  if (!isSupabaseConfigured) return sample.getPercentile(amount);
  return Number(must(await db().rpc("payout_percentile", { amount }), "payout_percentile"));
});

export const getCoverage = cache(async (): Promise<ChainCoverage[]> => {
  if (!isSupabaseConfigured) return [];
  const rows = must(await db().from("ingest_state").select("*").order("chain"), "ingest_state");
  return rows.map((r) => ({
    chain: r.chain,
    contract: r.contract,
    fromBlock: Number(r.from_block),
    lastBlock: Number(r.last_block),
    updatedAt: r.updated_at,
  }));
});

/** Payout pages worth indexing (and prerendering): sizeable payouts only, to avoid thin pages. */
export const INDEXABLE_MIN_USD = 500;

export const getIndexablePayouts = cache(async (limit = 5000): Promise<Payout[]> => {
  if (!isSupabaseConfigured) return [];
  return must(
    await view().gte("amount_usd", INDEXABLE_MIN_USD).order("amount_usd", { ascending: false }).limit(limit),
    "indexable payouts",
  ).map(toPayout);
});
