import { formatUsd, formatUsdCompact } from "@/lib/format";

export function DailyChart({ series, title }: { series: { date: number; amount: number; count: number }[]; title: string }) {
  const max = Math.max(1, ...series.map((d) => d.amount));
  const W = 600;
  const H = 160;
  const gap = 3;
  const bw = (W - gap * (series.length - 1)) / series.length;
  const total = series.reduce((s, d) => s + d.amount, 0);
  return (
    <figure className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-paper">{title}</span>
        <span className="tabular font-mono text-sm text-muted-foreground">{formatUsdCompact(total)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-40 w-full" role="img" aria-label={`${title}: ${formatUsd(total)} total`}>
        {series.map((d, i) => {
          const h = Math.max(d.amount > 0 ? 2 : 0, (d.amount / max) * (H - 4));
          return (
            <rect
              key={d.date}
              x={i * (bw + gap)}
              y={H - h}
              width={bw}
              height={h}
              rx={2}
              className={i === series.length - 1 ? "fill-mint/50" : "fill-mint"}
            >
              <title>{`${new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}: ${formatUsd(d.amount)} across ${d.count} payouts`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{new Date(series[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
        <span>Today (partial)</span>
      </div>
    </figure>
  );
}
