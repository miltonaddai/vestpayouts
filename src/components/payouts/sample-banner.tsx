import { TriangleAlert } from "lucide-react";

export function SampleDataBanner() {
  return (
    <div role="status" className="border-b border-amber/30 bg-amber/10">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-amber sm:px-6">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Sample data.</strong> No real payouts have been ingested yet, so the figures below are illustrative
          placeholders, not real Vest payouts. Run <code className="font-mono">yarn ingest</code> to load on-chain data.
        </p>
      </div>
    </div>
  );
}
