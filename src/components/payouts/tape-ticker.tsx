import Link from "next/link";
import { formatUsd, shortAddress } from "@/lib/format";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";

/** Scrolling "ticker tape" of the latest payouts. Duplicated once for a seamless loop. */
export function TapeTicker({ payouts }: { payouts: Payout[] }) {
  if (payouts.length < 4) return null;
  const items = [...payouts, ...payouts];
  return (
    <div className="relative overflow-hidden border-y border-ink-800 bg-ink-900/80" aria-label="Latest Vest payouts ticker">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-950 to-transparent" />
      <ul className="animate-tape flex w-max gap-8 py-2.5 hover:[animation-play-state:paused]">
        {items.map((p, i) => (
          <li key={`${p.id}-${i}`} aria-hidden={i >= payouts.length} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <span className="font-mono text-muted-foreground">{p.wallet ? shortAddress(p.wallet) : p.trader}</span>
            <Link href={payoutRoute(p)} tabIndex={i >= payouts.length ? -1 : 0} className="tabular font-mono font-semibold text-mint">
              +{formatUsd(p.amount, true)}
            </Link>
            <span className="text-xs text-ink-700">◆</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
