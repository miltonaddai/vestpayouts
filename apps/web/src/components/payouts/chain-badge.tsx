import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  base: "border-[#3d7bff]/40 bg-[#3d7bff]/10 text-[#9bbcff]",
  arbitrum: "border-[#28a0f0]/40 bg-[#28a0f0]/10 text-[#8fd0ff]",
  manual: "border-amber/40 bg-amber/10 text-amber",
  sample: "border-amber/50 bg-amber/15 text-amber",
};

const LABEL: Record<string, string> = { base: "Base", arbitrum: "Arbitrum", manual: "Reported", sample: "Sample" };

export function ChainBadge({ payout, className }: { payout: Payout; className?: string }) {
  const key = payout.source === "onchain" ? payout.chain! : payout.source;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase",
        STYLES[key],
        className,
      )}
    >
      {LABEL[key]}
    </span>
  );
}
