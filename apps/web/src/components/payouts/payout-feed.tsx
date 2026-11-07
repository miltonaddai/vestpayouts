import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate, formatUsd } from "@/lib/format";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";
import { ChainBadge } from "./chain-badge";
import { TimeAgo } from "./time-ago";
import { WalletDisplay } from "./wallet-display";

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5", className)} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
      <span className="relative inline-flex size-2.5 rounded-full bg-mint" />
    </span>
  );
}

export function PayoutFeed({ payouts, title = "Live Vest payout feed", syncedAt }: { payouts: Payout[]; title?: string; syncedAt: number | null }) {
  return (
    <section aria-labelledby="feed-title" className="rounded-2xl border border-ink-800 bg-ink-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <LiveDot />
          <h2 id="feed-title" className="text-base font-semibold text-paper">
            {title}
          </h2>
        </div>
        {syncedAt && (
          <p className="text-xs text-muted-foreground">
            Synced <TimeAgo ms={syncedAt} initial={formatDate(syncedAt, true)} />
          </p>
        )}
      </div>
      {payouts.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No payouts recorded yet. Data appears here after the first ingestion run.
        </p>
      ) : (
        <ol className="divide-y divide-ink-800">
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
              <Link
                href={payoutRoute(p)}
                className="tabular text-right font-mono text-base font-semibold text-mint hover:text-mint-300"
              >
                +{formatUsd(p.amount, true)}
              </Link>
              <p className="col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:w-20 sm:text-right">
                <TimeAgo ms={p.paidAt} initial={formatDate(p.paidAt, true)} />
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="border-t border-ink-800 px-5 py-3">
        <Link href="/payouts" className="inline-flex items-center gap-1.5 text-sm font-medium text-mint hover:text-mint-300">
          See every Vest payout <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
