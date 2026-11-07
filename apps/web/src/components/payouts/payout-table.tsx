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
      <div className="border border-dashed border-line px-6 py-14 text-center">
        <p className="font-medium text-ink">No payouts match these filters.</p>
        <p className="mt-1 text-sm text-sub">Try a wider date range or a lower minimum amount.</p>
      </div>
    );
  }
  return (
    <div className="min-w-0 max-w-full overflow-x-auto border border-line bg-background">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-paper font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Amount</th>
            {showWallet && <th scope="col" className="px-4 py-3 font-medium">Trader wallet</th>}
            <th scope="col" className="px-4 py-3 font-medium">Chain</th>
            <th scope="col" className="px-4 py-3 font-medium">Paid (UTC)</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payouts.map((p) => (
            <tr key={p.id} className="hover:bg-paper">
              <td className="px-4 py-3">
                <Link href={payoutRoute(p)} className="tabular font-mono font-medium text-green hover:text-ink">
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
              <td className="px-4 py-3 whitespace-nowrap text-sub">{formatDate(p.paidAt, true)}</td>
              <td className="px-4 py-3 text-right">
                {p.txHash && p.chain ? (
                  <a
                    href={txUrl(p.chain, p.txHash)}
                    target="_blank"
                    rel="noopener nofollow"
                    className="inline-flex items-center gap-1 font-mono text-[12px] text-sub hover:text-ink"
                    aria-label={`View transaction for ${formatUsd(p.amount, true)} payout on explorer`}
                  >
                    Tx <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : p.proofUrl ? (
                  <a href={p.proofUrl} target="_blank" rel="noopener nofollow" className="font-mono text-[12px] text-sub hover:text-ink">
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
