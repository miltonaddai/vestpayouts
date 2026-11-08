import Link from "next/link";
import { formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { TimeAgo } from "./time-ago";

/** Scrolling ticker of the latest payouts. Duplicated once for a seamless loop. */
export function TapeTicker({ payouts }: { payouts: Payout[] }) {
  if (payouts.length < 4) return null;
  const items = [...payouts, ...payouts];
  return (
    <div className="relative overflow-hidden border-y border-line bg-paper" aria-label="Latest Vest payouts ticker">
      <ul className="animate-tape flex w-max gap-8 py-2.5 hover:[animation-play-state:paused]">
        {items.map((p, i) => (
          <li key={`${p.id}-${i}`} aria-hidden={i >= payouts.length} className="flex items-baseline gap-2 text-sm leading-none whitespace-nowrap">
            <span className="font-mono text-[13px] text-sub">{p.wallet ? shortAddress(p.wallet) : p.trader}</span>
            <Link href={payoutRoute(p)} tabIndex={i >= payouts.length ? -1 : 0} className="tabular font-mono font-medium text-green">
              +{formatUsd(p.amount, true)}
            </Link>
            <span className="tabular font-mono text-[12px] text-sub">
              <TimeAgo ms={p.paidAt} initial={timeAgo(p.paidAt)} />
            </span>
            <span className="text-[11px] text-line" aria-hidden="true">
              /
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
