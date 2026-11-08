import Link from "next/link";
import { shortAddress } from "@/lib/format";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

export function WalletDisplay({
  payout,
  label,
  link = true,
  className,
}: {
  payout: Payout;
  label?: string | null;
  link?: boolean;
  className?: string;
}) {
  const name = label ?? payout.trader;
  if (!payout.wallet) return <span className="text-ink">{name ?? "Unknown trader"}</span>;
  const content = (
    <>
      {name && <span className="mr-1.5 font-sans text-ink">{name}</span>}
      <span className={cn("whitespace-nowrap", name && "text-sub")}>{shortAddress(payout.wallet)}</span>
    </>
  );
  return link ? (
    <Link href={`/wallets/${payout.wallet}`} className={cn("font-mono text-sm text-ink hover:text-signal", className)}>
      {content}
    </Link>
  ) : (
    <span className={cn("font-mono text-sm text-ink", className)}>{content}</span>
  );
}
