import Link from "next/link";
import { formatDuration, formatInt, formatUsd } from "@/lib/format";
import { getSummary } from "@/lib/payouts/repository";

/** Live numbers dropped into guides so evergreen articles stay current between edits. */
export async function LiveStatsCallout() {
  const s = await getSummary();
  return (
    <aside className="not-prose my-8 rounded-2xl border border-mint/25 bg-mint/[0.05] p-5">
      <p className="text-xs font-semibold tracking-wide text-mint uppercase">
        {s.isSample ? "Live Vest payout data (sample placeholder)" : "Live Vest payout data"}
      </p>
      <p className="mt-2 text-paper">
        Vest has paid <strong className="font-mono text-mint">{formatUsd(s.windows["30d"].amount)}</strong> across{" "}
        {formatInt(s.windows["30d"].count)} payouts in the last 30 days
        {s.medianProcessingHours != null && <>, with a median of {formatDuration(s.medianProcessingHours)} from request to wallet</>}.
      </p>
      <Link href="/payouts" className="mt-2 inline-block text-sm font-medium text-mint hover:text-mint-300">
        See every payout →
      </Link>
    </aside>
  );
}
