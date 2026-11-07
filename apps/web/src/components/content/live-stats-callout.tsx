import { ArrowLink } from "@/components/ui/split-cta";
import { formatDuration, formatInt, formatUsd } from "@/lib/format";
import { getSummary } from "@/lib/payouts/repository";

/** Live numbers dropped into guides so evergreen articles stay current between edits. */
export async function LiveStatsCallout() {
  const s = await getSummary();
  return (
    <aside className="not-prose my-8 border border-line bg-green-soft p-5">
      <p className="meta text-green">
        {s.isSample ? "Live Vest payout data (sample placeholder)" : "Live Vest payout data"}
      </p>
      <p className="mt-2 text-ink">
        Vest has paid <strong className="font-mono text-green">{formatUsd(s.windows["30d"].amount)}</strong> across{" "}
        {formatInt(s.windows["30d"].count)} payouts in the last 30 days
        {s.medianProcessingHours != null && <>, with a median of {formatDuration(s.medianProcessingHours)} from request to wallet</>}.
      </p>
      <ArrowLink href="/payouts" className="mt-3">See every payout</ArrowLink>
    </aside>
  );
}
