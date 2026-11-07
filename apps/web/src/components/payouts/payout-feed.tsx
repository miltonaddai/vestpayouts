import Link from "next/link";
import { formatDate, formatUsd } from "@/lib/format";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";
import { ChainBadge } from "./chain-badge";
import { TimeAgo } from "./time-ago";
import { WalletDisplay } from "./wallet-display";

export function LiveDot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-2 bg-green", className)} aria-hidden="true" />;
}

export function PayoutFeed({ payouts, title = "Live Vest payout feed", syncedAt }: { payouts: Payout[]; title?: string; syncedAt: number | null }) {
  return (
    <section aria-labelledby="feed-title" className="border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-5 py-3">
        <div className="flex items-center gap-2.5">
          <LiveDot />
          <h2 id="feed-title" className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink uppercase">
            {title}
          </h2>
        </div>
        {syncedAt && (
          <p className="font-mono text-[11px] text-sub">
            Synced <TimeAgo ms={syncedAt} initial={formatDate(syncedAt, true)} />
          </p>
        )}
      </div>
      {payouts.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-sub">
          No payouts recorded yet. Data appears here after the first ingestion run.
        </p>
      ) : (
        <ol className="divide-y divide-line">
          {payouts.map((p, i) => (
            <li
              key={p.id}
              className="animate-feed-in grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[auto_1fr_auto_auto]"
              style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
            >
              <ChainBadge payout={p} className="hidden sm:inline-flex" />
              <div className="min-w-0 truncate">
                <WalletDisplay payout={p} label={p.walletLabel} />
              </div>
              <Link href={payoutRoute(p)} className="tabular text-right font-mono text-base font-medium text-green hover:text-ink">
                +{formatUsd(p.amount, true)}
              </Link>
              <p className="col-span-2 font-mono text-[11px] text-sub sm:col-span-1 sm:w-20 sm:text-right">
                <TimeAgo ms={p.paidAt} initial={formatDate(p.paidAt, true)} />
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="border-t border-line bg-paper px-5 py-3">
        <Link href="/payouts" className="meta underline hover:text-ink">
          See every Vest payout →
        </Link>
      </div>
    </section>
  );
}
