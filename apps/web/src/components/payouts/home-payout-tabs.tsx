"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { PayoutTable } from "@/components/payouts/payout-table";
import { LiveDot } from "@/components/payouts/payout-feed";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

export const HOME_TABS = [
  { id: "realtime", label: "Realtime", caption: "Latest Vest payouts, newest first" },
  { id: "24h", label: "Last 24 hours", caption: "Largest Vest payouts in the last 24 hours" },
  { id: "7d", label: "Last 7 days", caption: "Largest Vest payouts in the last 7 days" },
  { id: "30d", label: "Last 30 days", caption: "Largest Vest payouts in the last 30 days" },
] as const;

export type HomeTabId = (typeof HOME_TABS)[number]["id"];

export function parseHomeTab(value: string | null | undefined): HomeTabId {
  return HOME_TABS.some((t) => t.id === value) ? (value as HomeTabId) : "realtime";
}

export function homeTabHref(id: HomeTabId) {
  return id === "realtime" ? "/" : `/?tab=${id}`;
}

const EMPTY: Record<HomeTabId, { title: string; body: string }> = {
  realtime: {
    title: "No payouts recorded yet.",
    body: "New Vest payouts appear here as soon as they are indexed.",
  },
  "24h": {
    title: "No payouts in the last 24 hours.",
    body: "When Vest sends a payout in this window, the largest ones will show up here.",
  },
  "7d": {
    title: "No payouts in the last 7 days.",
    body: "When Vest sends a payout in this window, the largest ones will show up here.",
  },
  "30d": {
    title: "No payouts in the last 30 days.",
    body: "When Vest sends a payout in this window, the largest ones will show up here.",
  },
};

async function fetchLatest(limit: number): Promise<Payout[] | null> {
  try {
    const res = await fetch(`/api/payouts?sort=latest&live=1&limit=${limit}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { rows?: Payout[] };
    return Array.isArray(data.rows) ? data.rows.slice(0, limit) : null;
  } catch {
    return null;
  }
}

export function HomePayoutTabs({
  initial,
  limit = 10,
}: {
  initial: Record<HomeTabId, Payout[]>;
  limit?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseHomeTab(searchParams.get("tab"));
  const [realtime, setRealtime] = useState(initial.realtime);
  const reactId = useId();
  const panelId = `${reactId}-panel`;

  const refreshLatest = useCallback(async () => {
    const rows = await fetchLatest(limit);
    if (rows) setRealtime(rows);
  }, [limit]);

  useEffect(() => {
    setRealtime(initial.realtime);
  }, [initial.realtime]);

  useEffect(() => {
    if (tab !== "realtime") return;
    const interval = window.setInterval(() => {
      void refreshLatest();
    }, 15_000);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let teardown: (() => void) | undefined;
    if (url && key) {
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const channel = sb
        .channel("home-payouts-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, () => {
          void refreshLatest();
        })
        .subscribe();
      teardown = () => {
        void sb.removeChannel(channel);
      };
    }

    return () => {
      window.clearInterval(interval);
      teardown?.();
    };
  }, [tab, refreshLatest]);

  const rows = tab === "realtime" ? realtime : initial[tab];
  const meta = HOME_TABS.find((t) => t.id === tab) ?? HOME_TABS[0];
  const empty = EMPTY[tab];

  function onTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    const i = HOME_TABS.findIndex((t) => t.id === tab);
    const last = HOME_TABS.length - 1;
    const nextIndex =
      event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" ? (i + 1) % HOME_TABS.length : (i - 1 + HOME_TABS.length) % HOME_TABS.length;
    const next = HOME_TABS[nextIndex];
    router.replace(homeTabHref(next.id), { scroll: false });
    document.getElementById(`payout-tab-${next.id}`)?.focus();
  }

  return (
    <div className="border border-line bg-background">
      <div
        role="tablist"
        aria-label="Payout period"
        className="flex flex-wrap border-b border-line"
        onKeyDown={onTabListKeyDown}
      >
        {HOME_TABS.map((t) => {
          const selected = t.id === tab;
          return (
            <Link
              key={t.id}
              id={`payout-tab-${t.id}`}
              href={homeTabHref(t.id)}
              scroll={false}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "inline-flex items-center gap-2 border-r border-line px-4 py-2.5 font-mono text-[12px] tracking-[0.02em] last:border-r-0",
                selected ? "bg-ink text-background" : "bg-background text-sub hover:text-ink",
              )}
            >
              {t.id === "realtime" && <LiveDot className={selected ? "bg-green-bright" : undefined} />}
              {t.label}
            </Link>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={`payout-tab-${tab}`}>
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium text-ink">{empty.title}</p>
            <p className="mt-1 text-sm text-sub">{empty.body}</p>
          </div>
        ) : (
          <PayoutTable payouts={rows} caption={meta.caption} className="border-0" />
        )}
      </div>
      <div className="border-t border-line bg-paper px-5 py-3">
        <Link href="/payouts" className="meta underline hover:text-ink">
          See every Vest payout →
        </Link>
      </div>
    </div>
  );
}
