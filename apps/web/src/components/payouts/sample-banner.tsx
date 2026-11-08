export function SampleDataBanner() {
  return (
    <div role="status" className="border-b border-line bg-yellow-soft">
      <div className="px-6 py-3 text-sm text-ink md:px-14">
        <p>
          <strong className="font-mono text-[12px] tracking-[0.04em] text-orange uppercase">Sample data.</strong>{" "}
          No real payouts have been ingested yet, so the figures below are illustrative placeholders, not real Vest
          payouts.
        </p>
      </div>
    </div>
  );
}
