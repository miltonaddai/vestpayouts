import { formatUsd, formatUsdCompact } from "@/lib/format";

export function DailyChart({ series, title }: { series: { date: number; amount: number; count: number }[]; title: string }) {
  const max = Math.max(1, ...series.map((d) => d.amount));
  const W = 600;
  const H = 160;
  const gap = 3;
  const bw = series.length ? (W - gap * (series.length - 1)) / series.length : W;
  const total = series.reduce((s, d) => s + d.amount, 0);
  const first = series[0];
  return (
    <figure className="min-w-0 max-w-full overflow-hidden border border-line bg-background p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-ink uppercase">{title}</span>
        <span className="tabular font-mono text-sm text-sub">{formatUsdCompact(total)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-40 w-full max-w-full" role="img" aria-label={`${title}: ${formatUsd(total)} total`}>
        {series.map((d, i) => {
          const h = Math.max(d.amount > 0 ? 2 : 0, (d.amount / max) * (H - 4));
          return (
            <rect
              key={d.date}
              x={i * (bw + gap)}
              y={H - h}
              width={bw}
              height={h}
              className={i === series.length - 1 ? "fill-signal/45" : "fill-signal"}
            >
              <title>{`${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}: ${formatUsd(d.amount)} across ${d.count} payouts`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-sub">
        <span>
          {first
            ? new Date(first.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
            : "—"}
        </span>
        <span>Today (partial)</span>
      </div>
    </figure>
  );
}
