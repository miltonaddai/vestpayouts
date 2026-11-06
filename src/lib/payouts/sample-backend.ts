/** In-memory backend used only when Supabase isn't configured. Every row is a labelled sample. */
import { SAMPLE_NOTE, SAMPLE_ROWS, sampleTraderName } from "./sample-data";
import type { LeaderboardRow, Payout, PayoutPage, PayoutQuery, Period, Summary, WindowStats } from "./types";

const HOUR = 3_600_000;
const PERIOD_MS: Record<Period, number> = { "24h": 24 * HOUR, "7d": 168 * HOUR, "30d": 720 * HOUR, all: Infinity };

function rows(): Payout[] {
  const now = Date.now();
  return SAMPLE_ROWS.map((r) => ({
    id: r.ref,
    source: "sample" as const,
    chain: null,
    txHash: null,
    logIndex: null,
    block: null,
    paidAt: now - r.hoursAgo * HOUR,
    requestedAt: now - (r.hoursAgo + r.processingHours) * HOUR,
    wallet: null,
    walletLabel: null,
    amount: r.amount,
    trader: sampleTraderName(r.ref),
    proofUrl: null,
    note: SAMPLE_NOTE,
  })).sort((a, b) => b.paidAt - a.paidAt);
}

const inPeriod = (list: Payout[], p: Period) => list.filter((x) => Date.now() - x.paidAt <= PERIOD_MS[p]);

function stats(list: Payout[]): WindowStats {
  return {
    amount: list.reduce((s, p) => s + p.amount, 0),
    count: list.length,
    wallets: new Set(list.map((p) => p.trader)).size,
    largest: list.reduce<Payout | null>((m, p) => (!m || p.amount > m.amount ? p : m), null),
  };
}

const median = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function getSummary(): Summary {
  const all = rows();
  const recent = inPeriod(all, "30d");
  return {
    windows: { "24h": stats(inPeriod(all, "24h")), "7d": stats(inPeriod(all, "7d")), "30d": stats(recent), all: stats(all) },
    medianAmount30d: median(recent.map((p) => p.amount)),
    medianProcessingHours: median(recent.map((p) => (p.paidAt - p.requestedAt!) / HOUR)),
    byChain: [],
    firstPaidAt: all.at(-1)?.paidAt ?? null,
    syncedAt: null,
    isSample: true,
  };
}

export const getLatest = (n: number) => rows().slice(0, n);
export const getLargest = (n: number, period: Period) =>
  inPeriod(rows(), period).sort((a, b) => b.amount - a.amount).slice(0, n);

export function getDailySeries(days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * 24 * HOUR;
  const buckets = Array.from({ length: days }, (_, i) => ({ date: first + i * 24 * HOUR, amount: 0, count: 0 }));
  for (const p of rows()) {
    const b = buckets[Math.floor((p.paidAt - first) / (24 * HOUR))];
    if (b) {
      b.amount += p.amount;
      b.count++;
    }
  }
  return buckets;
}

export function getLeaderboard(period: Period, limit: number): LeaderboardRow[] {
  return inPeriod(rows(), period)
    .map((p) => ({ key: p.id, wallet: null, label: p.trader, total: p.amount, count: 1, largest: p.amount, lastPaidAt: p.paidAt }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function queryPayouts(q: PayoutQuery, pageSize: number): PayoutPage {
  let list = inPeriod(rows(), q.period ?? "all");
  if (q.chain) list = [];
  if (q.min) list = list.filter((p) => p.amount >= q.min!);
  if (q.q) list = list.filter((p) => p.trader?.toLowerCase().includes(q.q!.toLowerCase()));
  if (q.sort === "largest") list.sort((a, b) => b.amount - a.amount);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return {
    rows: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
    sum: list.reduce((s, p) => s + p.amount, 0),
    page,
    pages,
  };
}

export function getPayoutsAtRoute(network: string, ref: string) {
  if (network !== "sample") return null;
  const p = rows().find((r) => r.id === ref);
  return p ? [p] : null;
}

export function getPercentile(amount: number) {
  const all = rows();
  return (all.filter((p) => p.amount < amount).length / all.length) * 100;
}
