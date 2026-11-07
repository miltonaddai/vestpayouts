import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  base: "border-line bg-blue-soft text-signal",
  arbitrum: "border-line bg-paper text-ink",
  manual: "border-line bg-orange-soft text-orange",
  sample: "border-line bg-yellow-soft text-orange",
};

const LABEL: Record<string, string> = { base: "Base", arbitrum: "Arbitrum", manual: "Reported", sample: "Sample" };

export function ChainBadge({ payout, className }: { payout: Payout; className?: string }) {
  const key = payout.source === "onchain" ? payout.chain! : payout.source;
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.04em] uppercase",
        STYLES[key],
        className,
      )}
    >
      {LABEL[key]}
    </span>
  );
}
