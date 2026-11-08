import "server-only";
import { cache } from "react";
import { getFreshPublicClient, getPublicClient, isSupabaseConfigured } from "@/lib/supabase/clients";
import type { PayoutRow } from "@/lib/supabase/database.types";
import type { ChainId } from "./chains";
import * as local from "./local-backend";
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

function fileBackend() {
  return local.hasLocalOnchainStore() ? local : sample;
}

export function dataMode() {
  if (isSupabaseConfigured) return "supabase";
  return local.hasLocalOnchainStore() ? "local-onchain" : "sample-local";
}

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

function emptyWindow(): WindowStats {
  return { amount: 0, count: 0, wallets: 0, largest: null };
}

export function emptySummary(): Summary {
  return {
    windows: { "24h": emptyWindow(), "7d": emptyWindow(), "30d": emptyWindow(), all: emptyWindow() },
    medianAmount30d: null,
    medianProcessingHours: null,
    byChain: [],
    firstPaidAt: null,
    syncedAt: null,
    isSample: false,
  };
}

function emptyPage(page = 1): PayoutPage {
  return { rows: [], total: 0, sum: 0, page, pages: 1 };
}

function logSupabaseFailure(what: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Supabase ${what} failed: ${message}`);
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  // Label the query so a try block with several calls says which one failed.
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

function fromLocalOr<T>(read: () => T, empty: T): T {
  try {
    if (local.hasLocalOnchainStore()) return read();
  } catch (err) {
    console.error(`Local payout store fallback failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return empty;
}

let lastSummary: Summary | null = null;
const lastLatest = new Map<number, Payout[]>();
const lastLargest = new Map<string, Payout[]>();
const lastDaily = new Map<number, { date: number; amount: number; count: number }[]>();
const lastLeaderboard = new Map<string, LeaderboardRow[]>();

function since(period: Period) {
  const ms = { "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000, all: 0 }[period];
  return ms ? new Date(Date.now() - ms).toISOString() : null;
}

const db = () => getPublicClient();
const view = () => db().from("visible_payouts").select(COLUMNS);

type RawWindow = { amount: number; count: number; wallets: number; largest: PayoutRow | null };

function mapSummary(raw: {
  windows: Record<Period, RawWindow>;
  median_amount_30d: number | null;
  median_processing_hours_30d: number | null;
  by_chain: { chain: ChainId; amount: number; count: number }[];
  first_paid_at: string | null;
  synced_at: string | null;
  is_sample: boolean;
}): Summary {
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
    byChain: (raw.by_chain ?? []).map((c) => ({ ...c, amount: Number(c.amount), count: Number(c.count) })),
    firstPaidAt: raw.first_paid_at ? Date.parse(raw.first_paid_at) : null,
    syncedAt: raw.synced_at ? Date.parse(raw.synced_at) : null,
    isSample: raw.is_sample,
  };
}

export const getSummary = cache(async (): Promise<Summary> => {
  if (!isSupabaseConfigured) return fileBackend().getSummary();
  try {
    const raw = unwrap(await db().rpc("payout_summary"), "payout_summary") as unknown as Parameters<typeof mapSummary>[0];
    const summary = mapSummary(raw);
    lastSummary = summary;
    return summary;
  } catch (err) {
    logSupabaseFailure("payout_summary", err);
    if (lastSummary) return lastSummary;
    return fromLocalOr(() => local.getSummary(), emptySummary());
  }
});

/** Uncached summary for the live counters (/api/summary). Falls back like getSummary. */
export async function getSummaryLive(): Promise<Summary> {
  if (!isSupabaseConfigured) return fileBackend().getSummary();
  try {
    const raw = unwrap(await getFreshPublicClient().rpc("payout_summary"), "payout_summary live") as unknown as Parameters<
      typeof mapSummary
    >[0];
    const summary = mapSummary(raw);
    lastSummary = summary;
    return summary;
  } catch (err) {
    logSupabaseFailure("payout_summary live", err);
    if (lastSummary) return lastSummary;
    return fromLocalOr(() => local.getSummary(), emptySummary());
  }
}

export const getLatest = cache(async (n = 12): Promise<Payout[]> => {
  if (!isSupabaseConfigured) return fileBackend().getLatest(n);
  try {
    const rows = unwrap(await view().order("paid_at", { ascending: false }).limit(n), "latest").map(toPayout);
    lastLatest.set(n, rows);
    return rows;
  } catch (err) {
    logSupabaseFailure("latest", err);
    return lastLatest.get(n) ?? fromLocalOr(() => local.getLatest(n), []);
  }
});

export const getLargest = cache(async (n = 10, period: Period = "all"): Promise<Payout[]> => {
  if (!isSupabaseConfigured) return fileBackend().getLargest(n, period);
  try {
    let q = view();
    const s = since(period);
    if (s) q = q.gte("paid_at", s);
    const rows = unwrap(await q.order("amount_usd", { ascending: false }).limit(n), "largest").map(toPayout);
    lastLargest.set(`${period}:${n}`, rows);
    return rows;
  } catch (err) {
    logSupabaseFailure("largest", err);
    return lastLargest.get(`${period}:${n}`) ?? fromLocalOr(() => local.getLargest(n, period), []);
  }
});

/** Uncached latest rows for the landing Realtime tab (polling the local store or Supabase — never Alchemy). */
export async function getLatestLive(n = 12): Promise<Payout[]> {
  if (!isSupabaseConfigured) return fileBackend().getLatest(n);
  try {
    return unwrap(
      await getFreshPublicClient()
        .from("visible_payouts")
        .select(COLUMNS)
        .order("paid_at", { ascending: false })
        .limit(n),
      "latest-live",
    ).map(toPayout);
  } catch (err) {
    logSupabaseFailure("latest-live", err);
    return lastLatest.get(n) ?? fromLocalOr(() => local.getLatest(n), []);
  }
}

export const getDailySeries = cache(async (days = 30) => {
  if (!isSupabaseConfigured) return fileBackend().getDailySeries(days);
  try {
    const rows = unwrap(await db().rpc("payout_daily", { days }), "payout_daily");
    const series = rows.map((r) => ({ date: Date.parse(`${r.day}T00:00:00Z`), amount: Number(r.amount), count: Number(r.payouts) }));
    lastDaily.set(days, series);
    return series;
  } catch (err) {
    logSupabaseFailure("payout_daily", err);
    return lastDaily.get(days) ?? fromLocalOr(() => local.getDailySeries(days), []);
  }
});

export const getLeaderboard = cache(async (period: Period, limit = 50): Promise<LeaderboardRow[]> => {
  if (!isSupabaseConfigured) return fileBackend().getLeaderboard(period, limit);
  try {
    const rows = unwrap(await db().rpc("payout_leaderboard", { period, max_rows: limit }), "payout_leaderboard");
    const mapped = rows.map((r, i) => ({
      key: r.wallet ?? r.label ?? String(i),
      wallet: r.wallet,
      label: r.label,
      total: Number(r.total),
      count: Number(r.payouts),
      largest: Number(r.largest),
      lastPaidAt: Date.parse(r.last_paid_at),
    }));
    lastLeaderboard.set(`${period}:${limit}`, mapped);
    return mapped;
  } catch (err) {
    logSupabaseFailure("payout_leaderboard", err);
    return lastLeaderboard.get(`${period}:${limit}`) ?? fromLocalOr(() => local.getLeaderboard(period, limit), []);
  }
});

/** PostgREST `or` filter values must not contain its own delimiters. */
const sanitizeSearch = (q: string) => q.replace(/[^a-zA-Z0-9@_.\- ]/g, "").slice(0, 66);

export async function queryPayouts(query: PayoutQuery): Promise<PayoutPage> {
  if (!isSupabaseConfigured) return fileBackend().queryPayouts(query, PAGE_SIZE);
  try {
    const q = query.q ? sanitizeSearch(query.q.trim().toLowerCase()) : "";
    const period = query.period ?? "all";
    const totals = unwrap(
      await db().rpc("payout_search_totals", {
        p_chain: query.chain ?? null,
        p_min: query.min ?? null,
        p_period: period,
        p_q: q || null,
        // Only sent when used, so the call still works against the older function signature.
        ...(query.max ? { p_max: query.max } : {}),
        ...(query.from ? { p_from: new Date(query.from).toISOString() } : {}),
        ...(query.to ? { p_to: new Date(query.to).toISOString() } : {}),
      }),
      "payout_search_totals",
    )[0] ?? { payouts: 0, amount: 0 };
    const total = Number(totals.payouts);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, query.page ?? 1), pages);

    let sel = view();
    if (query.chain) sel = sel.eq("chain", query.chain);
    if (query.min) sel = sel.gte("amount_usd", query.min);
    if (query.max) sel = sel.lte("amount_usd", query.max);
    if (query.from) sel = sel.gte("paid_at", new Date(query.from).toISOString());
    if (query.to) sel = sel.lt("paid_at", new Date(query.to).toISOString());
    const s = since(period);
    if (s) sel = sel.gte("paid_at", s);
    if (q) sel = sel.or(`wallet.ilike.%${q}%,tx_hash.ilike.%${q}%,trader_name.ilike.%${q}%,wallet_label.ilike.%${q}%`);
    sel =
      query.sort === "largest"
        ? sel.order("amount_usd", { ascending: false }).order("id", { ascending: false })
        : sel.order("paid_at", { ascending: false }).order("id", { ascending: false });
    const from = (page - 1) * PAGE_SIZE;
    const rows = unwrap(await sel.range(from, from + PAGE_SIZE - 1), "query payouts").map(toPayout);
    return { rows, total, sum: Number(totals.amount), page, pages };
  } catch (err) {
    logSupabaseFailure("query payouts", err);
    return fromLocalOr(() => local.queryPayouts(query, PAGE_SIZE), emptyPage(query.page ?? 1));
  }
}

export const getPayoutsAtRoute = cache(async (network: string, ref: string): Promise<Payout[] | null> => {
  if (!isSupabaseConfigured) return fileBackend().getPayoutsAtRoute(network, ref);
  try {
    if (network === "base" || network === "arbitrum") {
      if (!/^0x[0-9a-fA-F]{64}$/.test(ref)) return null;
      const rows = unwrap(
        await view().eq("source", "onchain").eq("chain", network).eq("tx_hash", ref.toLowerCase()).order("log_index"),
        "payout by tx",
      );
      return rows.length ? rows.map(toPayout) : null;
    }
    if ((network === "manual" || network === "sample") && /^\d+$/.test(ref)) {
      const rows = unwrap(await view().eq("source", network).eq("id", Number(ref)), "payout by id");
      return rows.length ? rows.map(toPayout) : null;
    }
    return null;
  } catch (err) {
    logSupabaseFailure("payout by route", err);
    return fromLocalOr(() => local.getPayoutsAtRoute(network, ref), null);
  }
});

export const getWallet = cache(async (address: string): Promise<WalletProfile | null> => {
  if (!isSupabaseConfigured) {
    return local.hasLocalOnchainStore() ? local.getWallet(address) : null;
  }
  const a = address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return null;
  try {
    const [rows, alias] = await Promise.all([
      view().eq("wallet", a).order("paid_at", { ascending: false }).limit(1000),
      db().from("wallets").select("display_name, x_handle").eq("address", a).maybeSingle(),
    ]);
    const payouts = unwrap(rows, "wallet payouts").map(toPayout);
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
  } catch (err) {
    logSupabaseFailure("wallet payouts", err);
    return fromLocalOr(() => local.getWallet(a), null);
  }
});

export interface WalletRank {
  rank: number | null;
  /** How many wallets are ranked; null when only the top 500 could be checked. */
  wallets: number | null;
}

/**
 * All-time rank for a wallet. Uses the wallet_rank RPC (ranks every wallet);
 * if that isn't available yet, falls back to the precomputed top 500.
 */
export async function getWalletRank(address: string): Promise<WalletRank> {
  const a = address.toLowerCase();
  if (isSupabaseConfigured) {
    try {
      const res = (await getFreshPublicClient().rpc("wallet_rank", { addr: a })) as {
        data: { rank: number; wallets: number } | null;
        error: { message: string } | null;
      };
      if (!res.error) {
        return res.data ? { rank: Number(res.data.rank), wallets: Number(res.data.wallets) } : { rank: null, wallets: null };
      }
      logSupabaseFailure("wallet_rank", new Error(res.error.message));
    } catch (err) {
      logSupabaseFailure("wallet_rank", err);
    }
  }
  const top = await getLeaderboard("all", 500);
  const i = top.findIndex((r) => r.wallet?.toLowerCase() === a);
  return { rank: i >= 0 ? i + 1 : null, wallets: null };
}

export const getPercentile = cache(async (amount: number) => {
  if (!isSupabaseConfigured) return fileBackend().getPercentile(amount);
  try {
    return Number(unwrap(await db().rpc("payout_percentile", { amount }), "payout_percentile"));
  } catch (err) {
    logSupabaseFailure("payout_percentile", err);
    return fromLocalOr(() => local.getPercentile(amount), 0);
  }
});

export const getCoverage = cache(async (): Promise<ChainCoverage[]> => {
  if (!isSupabaseConfigured) return local.hasLocalOnchainStore() ? local.getCoverage() : [];
  try {
    const rows = unwrap(await db().from("ingest_state").select("*").order("chain"), "ingest_state");
    return rows.map((r) => ({
      chain: r.chain,
      contract: r.contract,
      fromBlock: Number(r.from_block),
      lastBlock: Number(r.last_block),
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    logSupabaseFailure("ingest_state", err);
    return fromLocalOr(() => local.getCoverage(), []);
  }
});

/** Payout pages worth indexing (and prerendering): sizeable payouts only, to avoid thin pages. */
export const INDEXABLE_MIN_USD = 500;

export const getIndexablePayouts = cache(async (limit = 5000): Promise<Payout[]> => {
  if (!isSupabaseConfigured) {
    return local.hasLocalOnchainStore() ? local.getIndexablePayouts(limit, INDEXABLE_MIN_USD) : [];
  }
  try {
    return unwrap(
      await view().gte("amount_usd", INDEXABLE_MIN_USD).order("amount_usd", { ascending: false }).limit(limit),
      "indexable payouts",
    ).map(toPayout);
  } catch (err) {
    logSupabaseFailure("indexable payouts", err);
    return fromLocalOr(() => local.getIndexablePayouts(limit, INDEXABLE_MIN_USD), []);
  }
});
