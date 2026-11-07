import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDate, formatUsd } from "@/lib/format";
import { txUrl } from "@/lib/payouts/chains";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { ChainBadge } from "./chain-badge";
import { WalletDisplay } from "./wallet-display";

export function PayoutTable({ payouts, caption, showWallet = true }: { payouts: Payout[]; caption: string; showWallet?: boolean }) {
  if (payouts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center">
        <p className="font-medium text-paper">No payouts match these filters.</p>
        <p className="mt-1 text-sm text-muted-foreground">Try a wider date range or a lower minimum amount.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-800 bg-ink-900/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-ink-800 text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Amount</th>
            {showWallet && <th scope="col" className="px-4 py-3 font-medium">Trader wallet</th>}
            <th scope="col" className="px-4 py-3 font-medium">Chain</th>
            <th scope="col" className="px-4 py-3 font-medium">Paid (UTC)</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {payouts.map((p) => (
            <tr key={p.id} className="hover:bg-ink-850/70">
              <td className="px-4 py-3">
                <Link href={payoutRoute(p)} className="tabular font-mono font-semibold text-mint hover:text-mint-300">
                  {formatUsd(p.amount, true)}
                </Link>
              </td>
              {showWallet && (
                <td className="px-4 py-3">
                  <WalletDisplay payout={p} label={p.walletLabel} />
                </td>
              )}
              <td className="px-4 py-3">
                <ChainBadge payout={p} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-paper/75">{formatDate(p.paidAt, true)}</td>
              <td className="px-4 py-3 text-right">
                {p.txHash && p.chain ? (
                  <a
                    href={txUrl(p.chain, p.txHash)}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex items-center gap-1 text-paper/70 hover:text-mint"
                    aria-label={`View transaction for ${formatUsd(p.amount, true)} payout on explorer`}
                  >
                    Tx <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : p.proofUrl ? (
                  <a href={p.proofUrl} target="_blank" rel="noopener nofollow" className="text-paper/70 hover:text-mint">
                    Post
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
