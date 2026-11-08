"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { RollingNumber } from "@/components/ui/rolling-number";
import { formatDate, formatInt, formatUsd, formatUsdCompact } from "@/lib/format";
import type { Summary } from "@/lib/payouts/types";

/**
 * Live totals for the home page. The server renders with its summary; the
 * browser then polls /api/summary (CDN-cached ~10s) and every <Live> value
 * rolls to its new number. Polling pauses while the tab is hidden.
 */
const POLL_MS = 15_000;
const SummaryContext = createContext<Summary | null>(null);

export function LiveSummaryProvider({ initial, children }: { initial: Summary; children: ReactNode }) {
  const [summary, setSummary] = useState(initial);

  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch("/api/summary", { signal: controller.signal });
        if (!res.ok) return;
        const next = (await res.json()) as Summary;
        if (!stopped && next?.windows) setSummary(next);
      } catch {
        // Offline or aborted: keep showing the last good numbers.
      }
    };
    const id = window.setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return <SummaryContext.Provider value={summary}>{children}</SummaryContext.Provider>;
}

export type LiveKey =
  | `${"all" | "24h" | "7d" | "30d"}.${"amount" | "count" | "wallets"}`
  | `${"all" | "30d"}.largest.${"amount" | "paidAt"}`
  | "median30d"
  | "avg30d"
  | `chain.${string}.${"amount" | "count"}`;

export type LiveFormat = "usd" | "usd2" | "compact" | "int" | "date";

function pick(s: Summary, key: LiveKey): number | null {
  if (key === "median30d") return s.medianAmount30d;
  if (key === "avg30d") return s.windows["30d"].count ? s.windows["30d"].amount / s.windows["30d"].count : null;
  const parts = key.split(".");
  if (parts[0] === "chain") {
    const c = s.byChain.find((x) => x.chain === parts[1]);
    return c ? c[parts[2] as "amount" | "count"] : null;
  }
  const w = s.windows[parts[0] as keyof Summary["windows"]];
  if (parts[1] === "largest") return w.largest ? w.largest[parts[2] === "paidAt" ? "paidAt" : "amount"] : null;
  return w[parts[1] as "amount" | "count" | "wallets"];
}

const FORMAT: Record<LiveFormat, (n: number) => string> = {
  usd: (n) => formatUsd(n),
  usd2: (n) => formatUsd(n, true),
  compact: formatUsdCompact,
  int: formatInt,
  date: (n) => formatDate(n),
};

/** One live figure. Numbers roll; dates just swap. */
export function Live({ k, f, prefix = "", fallback = "—" }: { k: LiveKey; f: LiveFormat; prefix?: string; fallback?: string }) {
  const summary = useContext(SummaryContext);
  if (!summary) throw new Error("<Live> must be inside <LiveSummaryProvider>");
  const n = pick(summary, k);
  if (n == null) return <>{fallback}</>;
  const text = prefix + FORMAT[f](n);
  return f === "date" ? <>{text}</> : <RollingNumber value={text} />;
}
