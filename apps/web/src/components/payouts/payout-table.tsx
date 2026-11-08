import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { txUrl } from "@/lib/payouts/chains";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";
import { ChainBadge } from "./chain-badge";
import { PaidTime, PaidTimeHeader } from "./paid-time";
import { WalletDisplay } from "./wallet-display";

/** Tighter padding on phones so the table fits without sideways scrolling. */
const CELL = "px-2 py-3 first:pl-3 last:pr-3 sm:px-4 sm:first:pl-4 sm:last:pr-4";

export function PayoutTable({
  payouts,
  caption,
  showWallet = true,
  className,
}: {
  payouts: Payout[];
  caption: string;
  showWallet?: boolean;
  className?: string;
}) {
  if (payouts.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-14 text-center">
        <p className="font-medium text-ink">No payouts match these filters.</p>
        <p className="mt-1 text-sm text-sub">Try a wider date range or a lower minimum amount.</p>
      </div>
    );
  }
  return (
    <div className={cn("min-w-0 max-w-full overflow-x-auto border border-line bg-background", className)}>
      <table className="w-full text-left text-sm sm:min-w-[640px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-paper font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
          <tr>
            <th scope="col" className={cn(CELL, "font-medium")}>Amount</th>
            {showWallet && (
              <th scope="col" className={cn(CELL, "font-medium")}>
                <span className="sm:hidden">Wallet</span>
                <span className="hidden sm:inline">Trader wallet</span>
              </th>
            )}
            <th scope="col" className={cn(CELL, "font-medium")}>
              <PaidTimeHeader />
            </th>
            <th scope="col" className={cn(CELL, "hidden font-medium sm:table-cell")}>Chain</th>
            <th scope="col" className={cn(CELL, "text-right font-medium")}>
              <span className="sr-only sm:not-sr-only">Proof</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payouts.map((p, i) => (
            <tr key={p.id} className="reveal-row hover:bg-paper" style={{ "--i": i } as React.CSSProperties}>
              <td className={CELL}>
                <Link href={payoutRoute(p)} className="tabular font-mono text-[13px] font-medium whitespace-nowrap text-green hover:text-ink sm:text-sm">
                  {formatUsd(p.amount, true)}
                </Link>
                {/* On phones the chain column is folded in here. */}
                <ChainBadge payout={p} className="mt-1 flex w-fit sm:hidden" />
              </td>
              {showWallet && (
                <td className={CELL}>
                  <WalletDisplay payout={p} label={p.walletLabel} className="text-[13px] sm:text-sm" />
                </td>
              )}
              <td className={cn(CELL, "tabular text-[13px] text-sub sm:text-sm sm:whitespace-nowrap")}>
                <PaidTime ms={p.paidAt} />
              </td>
              <td className={cn(CELL, "hidden sm:table-cell")}>
                <ChainBadge payout={p} />
              </td>
              <td className={cn(CELL, "text-right")}>
                {p.txHash && p.chain ? (
                  <a
                    href={txUrl(p.chain, p.txHash)}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex items-center gap-1 font-mono text-[13px] text-sub hover:text-ink"
                    aria-label={`View transaction for ${formatUsd(p.amount, true)} payout on explorer`}
                  >
                    <span className="hidden sm:inline">Tx</span> <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : p.proofUrl ? (
                  <a href={p.proofUrl} target="_blank" rel="noopener nofollow" className="font-mono text-[13px] text-sub hover:text-ink">
                    Post
                  </a>
                ) : (
                  <span className="text-sub">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
