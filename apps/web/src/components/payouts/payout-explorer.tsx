"use client";

import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatInt, formatUsd } from "@/lib/format";
import type { PayoutPage } from "@/lib/payouts/types";
import { PayoutTable } from "./payout-table";

interface Filters {
  chain: string;
  period: string;
  min: string;
  sort: string;
  q: string;
  page: number;
}

const DEFAULTS: Filters = { chain: "all", period: "all", min: "", sort: "latest", q: "", page: 1 };

function fromParams(sp: URLSearchParams): Filters {
  return {
    chain: sp.get("chain") ?? DEFAULTS.chain,
    period: sp.get("period") ?? DEFAULTS.period,
    min: sp.get("min") ?? DEFAULTS.min,
    sort: sp.get("sort") ?? DEFAULTS.sort,
    q: sp.get("q") ?? DEFAULTS.q,
    page: Number(sp.get("page")) || 1,
  };
}

function toQuery(f: Filters) {
  const p = new URLSearchParams();
  if (f.chain !== "all") p.set("chain", f.chain);
  if (f.period !== "all") p.set("period", f.period);
  if (f.min) p.set("min", f.min);
  if (f.sort !== "latest") p.set("sort", f.sort);
  if (f.q) p.set("q", f.q);
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}

/**
 * The first page is server-rendered (static/ISR) for crawlers; filters run client-side
 * against /api/payouts and are mirrored in the URL so filtered views are shareable.
 */
export function PayoutExplorer({ initial, isSample }: { initial: PayoutPage; isSample: boolean }) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => fromParams(new URLSearchParams(searchParams.toString())));
  const [data, setData] = useState<PayoutPage>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [qDraft, setQDraft] = useState(filters.q);
  const first = useRef(true);

  useEffect(() => {
    const qs = toQuery(filters);
    if (first.current) {
      first.current = false;
      if (!qs) return;
    }
    window.history.replaceState(null, "", qs ? `/payouts?${qs}` : "/payouts");
    const ctrl = new AbortController();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/payouts?${qs}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        setData(json);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      }
    });
    return () => ctrl.abort();
  }, [filters]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  return (
    <div>
      <form
        role="search"
        aria-label="Filter Vest payouts"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: qDraft.trim() });
        }}
        className="grid gap-3 border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_1.6fr]"
      >
        <label className="grid gap-1.5 font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          Chain
          <NativeSelect className="w-full" value={filters.chain} onChange={(e) => update({ chain: e.target.value })}>
            <NativeSelectOption value="all">All chains</NativeSelectOption>
            <NativeSelectOption value="base">Base</NativeSelectOption>
            <NativeSelectOption value="arbitrum">Arbitrum One</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          Period
          <NativeSelect className="w-full" value={filters.period} onChange={(e) => update({ period: e.target.value })}>
            <NativeSelectOption value="all">All time</NativeSelectOption>
            <NativeSelectOption value="24h">Last 24 hours</NativeSelectOption>
            <NativeSelectOption value="7d">Last 7 days</NativeSelectOption>
            <NativeSelectOption value="30d">Last 30 days</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          Minimum amount
          <NativeSelect className="w-full" value={filters.min} onChange={(e) => update({ min: e.target.value })}>
            <NativeSelectOption value="">Any amount</NativeSelectOption>
            <NativeSelectOption value="100">$100+</NativeSelectOption>
            <NativeSelectOption value="1000">$1,000+</NativeSelectOption>
            <NativeSelectOption value="10000">$10,000+</NativeSelectOption>
            <NativeSelectOption value="50000">$50,000+</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          Sort
          <NativeSelect className="w-full" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            <NativeSelectOption value="latest">Latest first</NativeSelectOption>
            <NativeSelectOption value="largest">Largest first</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          Wallet, tx hash or trader
          <span className="flex gap-2">
            <Input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="0x…"
              className="h-8 font-mono"
              spellCheck={false}
            />
            <Button type="submit" variant="secondary" aria-label="Search payouts">
              <Search />
            </Button>
          </span>
        </label>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-sub" aria-live="polite">
        <p>
          {pending && <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />}
          <span className="text-ink">{formatInt(data.total)}</span> {isSample ? "sample " : ""}payouts totalling{" "}
          <span className="font-mono text-green">{formatUsd(data.sum)}</span>
        </p>
        <p className="font-mono text-[12px]">
          Page {data.page} of {formatInt(data.pages)}
        </p>
      </div>

      {error ? (
        <div role="alert" className="mt-4 border border-line bg-red-soft px-5 py-6 text-coral">
          {error} Try again in a moment.
        </div>
      ) : (
        <div className={`mt-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
          <PayoutTable payouts={data.rows} caption="Vest payouts matching the selected filters" />
        </div>
      )}

      {data.pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={data.page <= 1 || pending} onClick={() => setFilters((f) => ({ ...f, page: data.page - 1 }))}>
            ← Newer
          </Button>
          <Button variant="outline" disabled={data.page >= data.pages || pending} onClick={() => setFilters((f) => ({ ...f, page: data.page + 1 }))}>
            Older →
          </Button>
        </nav>
      )}
    </div>
  );
}
