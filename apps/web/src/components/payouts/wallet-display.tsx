import Link from "next/link";
import { shortAddress } from "@/lib/format";
import type { Payout } from "@/lib/payouts/types";

export function WalletDisplay({ payout, label, link = true }: { payout: Payout; label?: string | null; link?: boolean }) {
  const name = label ?? payout.trader;
  if (!payout.wallet) return <span className="text-ink">{name ?? "Unknown trader"}</span>;
  const content = (
    <>
      {name && <span className="mr-1.5 font-sans text-ink">{name}</span>}
      <span className={name ? "text-sub" : ""}>{shortAddress(payout.wallet)}</span>
    </>
  );
  return link ? (
    <Link href={`/wallets/${payout.wallet}`} className="font-mono text-sm text-ink hover:text-signal">
      {content}
    </Link>
  ) : (
    <span className="font-mono text-sm text-ink">{content}</span>
  );
}
