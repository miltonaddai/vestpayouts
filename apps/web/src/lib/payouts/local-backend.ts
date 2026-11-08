/**
 * Reads real on-chain payouts written by the API ingest into
 * <repo>/data/onchain-store.json when Supabase is not configured.
 * Rows are source "onchain" — never labelled sample.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { ChainCoverage, LeaderboardRow, Payout, PayoutPage, PayoutQuery, Period, Summary, WalletProfile, WindowStats } from "./types";

const HOUR = 3_600_000;
const PERIOD_MS: Record<Period, number> = { "24h": 24 * HOUR, "7d": 168 * HOUR, "30d": 720 * HOUR, all: Infinity };

type StoredPayout = {
  id: number;
  source: "onchain";
  chain: "base" | "arbitrum";
  tx_hash: string;
  log_index: number;
  block_number: number;
  wallet: string;
  amount_usd: number;
  paid_at: string;
  requested_at: string | null;
  trader_name: string | null;
  proof_url: string | null;
  note: string | null;
  wallet_label: string | null;
};

type StoredState = {
  chain: "base" | "arbitrum";
  contract: string;
  from_block: number;
  last_block: number;
  updated_at: string;
};

type StoreFile = {
  version: 1;
  nextId: number;
  updatedAt: string;
  payouts: StoredPayout[];
  ingest_state: Record<string, StoredState>;
};

const DEFAULT_STORE = path.join(process.cwd(), "..", "..", "data", "onchain-store.json");

function storePath() {
  return process.env.LOCAL_PAYOUTS_PATH?.trim() || DEFAULT_STORE;
}

let memo: { path: string; mtime: number; store: StoreFile } | null = null;

export function readStoreFile(): StoreFile | null {
  const file = storePath();
  if (!file || !existsSync(/* turbopackIgnore: true */ file)) return null;
  try {
    const mtime = statSync(/* turbopackIgnore: true */ file).mtimeMs;
    if (memo && memo.path === file && memo.mtime === mtime) return memo.store;
    const store = JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8")) as StoreFile;
    if (!store || store.version !== 1 || !Array.isArray(store.payouts)) return null;
    memo = { path: file, mtime, store };
    return store;
  } catch {
    return null;
  }
}

export function hasLocalOnchainStore() {
  const store = readStoreFile();
  return Boolean(store && store.payouts.length > 0);
}

function toPayout(row: StoredPayout): Payout {
  return {
    id: String(row.id),
    source: "onchain",
    chain: row.chain,
    txHash: row.tx_hash,
    logIndex: row.log_index,
    block: row.block_number,
    paidAt: Date.parse(row.paid_at),
    requestedAt: row.requested_at ? Date.parse(row.requested_at) : null,
    wallet: row.wallet,
    walletLabel: row.wallet_label,
    amount: Number(row.amount_usd),
    trader: row.trader_name,
    proofUrl: row.proof_url,
    note: row.note,
  };
}

function load(): Payout[] {
  const store = readStoreFile();
  if (!store) return [];
  return store.payouts.map(toPayout).sort((a, b) => b.paidAt - a.paidAt || (b.logIndex ?? 0) - (a.logIndex ?? 0));
}

const inPeriod = (list: Payout[], period: Period) => list.filter((row) => Date.now() - row.paidAt <= PERIOD_MS[period]);

function stats(list: Payout[]): WindowStats {
  return {
    amount: list.reduce((sum, row) => sum + row.amount, 0),
    count: list.length,
    wallets: new Set(list.map((row) => row.wallet).filter(Boolean)).size,
    largest: list.reduce<Payout | null>((max, row) => (!max || row.amount > max.amount ? row : max), null),
  };
}

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function getSummary(): Summary {
  const all = load();
  const recent = inPeriod(all, "30d");
  const processing = recent
    .filter((row) => row.requestedAt)
    .map((row) => (row.paidAt - row.requestedAt!) / HOUR);
  const byChainMap = new Map<string, { chain: NonNullable<Payout["chain"]>; amount: number; count: number }>();
  for (const row of all) {
    if (!row.chain) continue;
    const cur = byChainMap.get(row.chain) ?? { chain: row.chain, amount: 0, count: 0 };
    cur.amount += row.amount;
    cur.count += 1;
    byChainMap.set(row.chain, cur);
  }
  const store = readStoreFile();
  return {
    windows: { "24h": stats(inPeriod(all, "24h")), "7d": stats(inPeriod(all, "7d")), "30d": stats(recent), all: stats(all) },
    medianAmount30d: median(recent.map((row) => row.amount)),
    medianProcessingHours: median(processing),
    byChain: [...byChainMap.values()],
    firstPaidAt: all.length ? Math.min(...all.map((row) => row.paidAt)) : null,
    syncedAt: store?.updatedAt ? Date.parse(store.updatedAt) : null,
    isSample: false,
  };
}

export const getLatest = (n: number) => load().slice(0, n);
export const getLargest = (n: number, period: Period) =>
  inPeriod(load(), period).sort((a, b) => b.amount - a.amount).slice(0, n);

export function getDailySeries(days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * 24 * HOUR;
  const buckets = Array.from({ length: days }, (_, i) => ({ date: first + i * 24 * HOUR, amount: 0, count: 0 }));
  for (const row of load()) {
    const bucket = buckets[Math.floor((row.paidAt - first) / (24 * HOUR))];
    if (bucket) {
      bucket.amount += row.amount;
      bucket.count += 1;
    }
  }
  return buckets;
}

export function getLeaderboard(period: Period, limit: number): LeaderboardRow[] {
  const map = new Map<string, LeaderboardRow>();
  for (const row of inPeriod(load(), period)) {
    const key = (row.wallet || row.id).toLowerCase();
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        key,
        wallet: row.wallet,
        label: row.walletLabel,
        total: row.amount,
        count: 1,
        largest: row.amount,
        lastPaidAt: row.paidAt,
      });
    } else {
      cur.total += row.amount;
      cur.count += 1;
      if (row.amount > cur.largest) cur.largest = row.amount;
      if (row.paidAt > cur.lastPaidAt) cur.lastPaidAt = row.paidAt;
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export function queryPayouts(query: PayoutQuery, pageSize: number): PayoutPage {
  let list = inPeriod(load(), query.period ?? "all");
  if (query.chain) list = list.filter((row) => row.chain === query.chain);
  if (query.min) list = list.filter((row) => row.amount >= query.min!);
  if (query.max) list = list.filter((row) => row.amount <= query.max!);
  if (query.from) list = list.filter((row) => row.paidAt >= query.from!);
  if (query.to) list = list.filter((row) => row.paidAt < query.to!);
  if (query.q) {
    const q = query.q.toLowerCase();
    list = list.filter(
      (row) =>
        row.wallet?.toLowerCase().includes(q) ||
        row.txHash?.toLowerCase().includes(q) ||
        row.trader?.toLowerCase().includes(q) ||
        row.walletLabel?.toLowerCase().includes(q),
    );
  }
  if (query.sort === "largest") list = [...list].sort((a, b) => b.amount - a.amount);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(Math.max(1, query.page ?? 1), pages);
  return {
    rows: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    sum: list.reduce((sum, row) => sum + row.amount, 0),
    page,
    pages,
  };
}

export function getPayoutsAtRoute(network: string, ref: string) {
  if (network === "base" || network === "arbitrum") {
    if (!/^0x[0-9a-fA-F]{64}$/.test(ref)) return null;
    const rows = load()
      .filter((row) => row.chain === network && row.txHash === ref.toLowerCase())
      .sort((a, b) => (a.logIndex ?? 0) - (b.logIndex ?? 0));
    return rows.length ? rows : null;
  }
  return null;
}

export function getWallet(address: string): WalletProfile | null {
  const a = address.toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return null;
  const payouts = load().filter((row) => row.wallet === a);
  if (!payouts.length) return null;
  const largest = payouts.reduce((max, row) => (row.amount > max.amount ? row : max), payouts[0]);
  return {
    address: a,
    label: payouts[0].walletLabel,
    xHandle: null,
    payouts,
    amount: payouts.reduce((sum, row) => sum + row.amount, 0),
    count: payouts.length,
    largest,
  };
}

export function getPercentile(amount: number) {
  const all = load();
  if (!all.length) return 0;
  return (all.filter((row) => row.amount < amount).length / all.length) * 100;
}

export function getCoverage(): ChainCoverage[] {
  const store = readStoreFile();
  if (!store) return [];
  return Object.values(store.ingest_state).map((row) => ({
    chain: row.chain,
    contract: row.contract,
    fromBlock: Number(row.from_block),
    lastBlock: Number(row.last_block),
    updatedAt: row.updated_at,
  }));
}

export function getIndexablePayouts(limit: number, minUsd: number) {
  return load()
    .filter((row) => row.amount >= minUsd && row.txHash)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
