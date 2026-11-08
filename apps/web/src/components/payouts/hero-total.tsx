"use client";

import { useState } from "react";
import { Live } from "@/components/payouts/live-summary";
import { cn } from "@/lib/utils";
import type { Period } from "@/lib/payouts/types";

const WINDOWS: { id: Period; label: string; short: string; caption: string }[] = [
  { id: "24h", label: "24 hours", short: "24h", caption: "in the last 24 hours" },
  { id: "7d", label: "7 days", short: "7d", caption: "in the last 7 days" },
  { id: "30d", label: "30 days", short: "30d", caption: "in the last 30 days" },
  { id: "all", label: "All time", short: "All", caption: "all time" },
];

/**
 * The home page's one headline figure. The toggle swaps the window and the
 * digits roll to the new total, so there's one number to read instead of five.
 */
export function HeroTotal({ since, chains }: { since: string | null; chains: { id: string; name: string }[] }) {
  const [w, setW] = useState<Period>("all");
  const win = WINDOWS.find((x) => x.id === w)!;

  return (
    <div className="mt-14 border-t border-line pt-8 md:mt-20 md:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="meta">
          Paid to traders · <span className="text-ink">{w === "all" && since ? `since ${since}` : win.caption}</span>
        </p>
        <div role="group" aria-label="Time window" className="inline-flex border border-line bg-background p-0.5">
          {WINDOWS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={w === x.id}
              onClick={() => setW(x.id)}
              className={cn(
                "px-3 py-1.5 font-mono text-[12px] tracking-[0.04em] uppercase transition-colors sm:px-4",
                w === x.id ? "bg-ink text-background" : "text-sub hover:bg-paper hover:text-ink",
              )}
            >
              <span className="sm:hidden">{x.short}</span>
              <span className="hidden sm:inline">{x.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p
            aria-live="polite"
            className="tabular font-heading text-[clamp(2.75rem,13vw,4.5rem)] leading-[0.9] font-medium tracking-[-0.05em] whitespace-nowrap text-green md:text-[112px] xl:text-[144px]"
          >
            <Live k={`${w}.amount`} f="usd" />
          </p>
          <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-sub md:text-[17px]">
            <span>
              <span className="text-ink">
                <Live k={`${w}.count`} f="int" />
              </span>{" "}
              payouts
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="text-ink">
                <Live k={`${w}.wallets`} f="int" />
              </span>{" "}
              wallets paid
            </span>
            {(w === "all" || w === "30d") && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  largest{" "}
                  <span className="text-ink">
                    <Live k={`${w}.largest.amount`} f="usd" />
                  </span>
                </span>
              </>
            )}
          </p>
        </div>

        {/* Secondary figures, kept small so the headline stays the headline. */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-line lg:border-l lg:pl-8">
          <Fact label="Median (30d)">
            <Live k="median30d" f="usd2" />
          </Fact>
          <Fact label="Average (30d)">
            <Live k="avg30d" f="usd2" />
          </Fact>
          {chains.slice(0, 2).map((c) => (
            <Fact key={c.id} label={`On ${c.name}`}>
              <Live k={`chain.${c.id}.amount`} f="compact" />
            </Fact>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="meta">{label}</dt>
      <dd className="tabular mt-1 font-heading text-[22px] leading-none font-medium tracking-[-0.03em] text-ink">{children}</dd>
    </div>
  );
}
