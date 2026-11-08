"use client";

import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "@/components/ui/split-cta";
import { Input } from "@/components/ui/input";
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select";
import { formatInt, formatUsd } from "@/lib/format";
import type { PayoutPage } from "@/lib/payouts/types";
import { PayoutTable } from "./payout-table";

interface Filters {
  chain: string;
  period: string;
  min: string;
  max: string;
  /** Custom range, "YYYY-MM-DD", used when period is "custom". */
  from: string;
  to: string;
  sort: string;
  q: string;
  page: number;
}

const CHAIN_OPTIONS: FilterOption[] = [
  { value: "all", label: "All chains" },
  { value: "base", label: "Base" },
  { value: "arbitrum", label: "Arbitrum One" },
];
const PERIOD_OPTIONS: FilterOption[] = [
  { value: "all", label: "All time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];
const MIN_OPTIONS: FilterOption[] = [
  { value: "", label: "Any amount" },
  { value: "100", label: "$100+" },
  { value: "1000", label: "$1,000+" },
  { value: "10000", label: "$10,000+" },
  { value: "50000", label: "$50,000+" },
];
const MAX_OPTIONS: FilterOption[] = [
  { value: "", label: "Any amount" },
  { value: "100", label: "Up to $100" },
  { value: "1000", label: "Up to $1,000" },
  { value: "10000", label: "Up to $10,000" },
  { value: "50000", label: "Up to $50,000" },
];
const SORT_OPTIONS: FilterOption[] = [
  { value: "latest", label: "Latest first" },
  { value: "largest", label: "Largest first" },
];

const DEFAULTS: Filters = { chain: "all", period: "all", min: "", max: "", from: "", to: "", sort: "latest", q: "", page: 1 };
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar day as "YYYY-MM-DD". */
function isoDay(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromParams(sp: URLSearchParams): Filters {
  return {
    chain: sp.get("chain") ?? DEFAULTS.chain,
    period: sp.get("period") ?? DEFAULTS.period,
    min: sp.get("min") ?? DEFAULTS.min,
    max: sp.get("max") ?? DEFAULTS.max,
    from: DAY_RE.test(sp.get("from") ?? "") ? sp.get("from")! : "",
    to: DAY_RE.test(sp.get("to") ?? "") ? sp.get("to")! : "",
    sort: sp.get("sort") ?? DEFAULTS.sort,
    q: sp.get("q") ?? DEFAULTS.q,
    page: Number(sp.get("page")) || 1,
  };
}

function toQuery(f: Filters) {
  const p = new URLSearchParams();
  if (f.chain !== "all") p.set("chain", f.chain);
  if (f.period !== "all") p.set("period", f.period);
  if (f.period === "custom") {
    if (f.from) p.set("from", f.from);
    if (f.to) p.set("to", f.to);
  }
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
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

  const choosePeriod = (period: string) => {
    if (period !== "custom") return update({ period });
    // Start a new custom range on the last 30 days so results show straight away.
    const today = new Date();
    update({
      period,
      from: filters.from || isoDay(new Date(today.getTime() - 29 * 86_400_000)),
      to: filters.to || isoDay(today),
    });
  };
  // A min above the max (or the reverse) would return nothing, so the other bound gives way.
  const chooseMin = (min: string) => update({ min, ...(min && filters.max && Number(filters.max) <= Number(min) ? { max: "" } : {}) });
  const chooseMax = (max: string) => update({ max, ...(max && filters.min && Number(filters.min) >= Number(max) ? { min: "" } : {}) });
  const maxOptions = MAX_OPTIONS.filter((o) => !o.value || !filters.min || Number(o.value) > Number(filters.min));
  const minOptions = MIN_OPTIONS.filter((o) => !o.value || !filters.max || Number(o.value) < Number(filters.max));

  return (
    <div>
      <form
        role="search"
        aria-label="Filter Vest payouts"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: qDraft.trim() });
        }}
        className="grid gap-3 border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.6fr]"
      >
        <FilterSelect label="Chain" value={filters.chain} options={CHAIN_OPTIONS} onChange={(chain) => update({ chain })} />
        <FilterSelect label="Period" value={filters.period} options={PERIOD_OPTIONS} onChange={choosePeriod} />
        <FilterSelect label="Minimum amount" value={filters.min} options={minOptions} onChange={chooseMin} />
        <FilterSelect label="Maximum amount" value={filters.max} options={maxOptions} onChange={chooseMax} />
        <FilterSelect label="Sort" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => update({ sort })} />
        <label className="grid gap-1.5 font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
          Wallet, tx hash or trader
          <span className="flex gap-2">
            <Input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="0x…"
              className="font-mono"
              spellCheck={false}
            />
            <Button type="submit" variant="secondary" aria-label="Search payouts">
              <Search />
            </Button>
          </span>
        </label>

        {filters.period === "custom" && (
          <fieldset className="col-span-full grid grid-cols-2 items-end gap-3 border-t border-line pt-3 sm:flex sm:flex-wrap">
            <legend className="sr-only">Custom date range</legend>
            <DateField label="From" value={filters.from} max={filters.to || undefined} onChange={(from) => update({ from })} />
            <span className="hidden pb-3 font-mono text-sub sm:inline" aria-hidden="true">
              →
            </span>
            <DateField label="To" value={filters.to} min={filters.from || undefined} onChange={(to) => update({ to })} />
            <p className="text-[13px] text-sub sm:pb-3">Both days included · UTC</p>
            <button
              type="button"
              onClick={() => update({ period: "all", from: "", to: "" })}
              className="h-11 border border-line bg-background px-4 sm:ml-auto font-mono text-[12px] tracking-[0.06em] text-sub uppercase transition-colors hover:border-ink hover:text-ink"
            >
              Clear range
            </button>
          </fieldset>
        )}
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-sub" aria-live="polite">
        <p>
          {pending && <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />}
          <span className="text-ink">{formatInt(data.total)}</span> {isSample ? "sample " : ""}payouts totalling{" "}
          <span className="font-mono text-green">{formatUsd(data.sum)}</span>
        </p>
        <p className="font-mono text-[13px]">
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
          <Button
            variant="outline"
            className="arrow-cta hover:border-ink hover:bg-ink hover:text-background focus-visible:border-ink focus-visible:bg-ink focus-visible:text-background"
            disabled={data.page <= 1 || pending}
            onClick={() => setFilters((f) => ({ ...f, page: data.page - 1 }))}
          >
            <ArrowIcon className="arrow-cta-icon-prev">←</ArrowIcon>
            Newer
          </Button>
          <Button
            variant="outline"
            className="arrow-cta hover:border-ink hover:bg-ink hover:text-background focus-visible:border-ink focus-visible:bg-ink focus-visible:text-background"
            disabled={data.page >= data.pages || pending}
            onClick={() => setFilters((f) => ({ ...f, page: data.page + 1 }))}
          >
            Older
            <ArrowIcon />
          </Button>
        </nav>
      )}
    </div>
  );
}

function DateField({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid min-w-0 gap-1.5 font-mono text-[12px] tracking-[0.04em] text-sub uppercase sm:w-44">
      {label}
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        // Only apply complete dates; the browser reports "" while a field is half typed.
        onChange={(e) => DAY_RE.test(e.target.value) && onChange(e.target.value)}
        className="h-11 w-full min-w-0 border border-line bg-background px-2.5 font-sans sm:px-3 text-[15px] tracking-normal text-ink normal-case transition-colors outline-none hover:border-sub focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/25"
      />
    </label>
  );
}
