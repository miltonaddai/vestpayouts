"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { formatInt, formatUsd, formatUsdCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

type Day = { date: number; amount: number; count: number };

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const HEIGHT = 300;
const M = { top: 16, right: 8, bottom: 30, left: 52 };
const MAX_BAR = 24;

const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Clean y-axis ticks: 0 and 3-5 round steps up to just above the max. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 1];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(v);
  return ticks;
}

/** Column with a 4px rounded data end and a square baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function DailyChart({ series, title }: { series: Day[]; title: string }) {
  const [range, setRange] = useState<Range>(30);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(1100);
  const plotRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  const days = useMemo(() => series.slice(-range), [series, range]);
  const lastIndex = days.length - 1;

  const stats = useMemo(() => {
    const total = days.reduce((s, d) => s + d.amount, 0);
    const count = days.reduce((s, d) => s + d.count, 0);
    // "Today" is partial, so it doesn't count toward the daily average or best day.
    const complete = days.slice(0, -1);
    const avg = complete.length ? complete.reduce((s, d) => s + d.amount, 0) / complete.length : 0;
    const best = complete.reduce<Day | null>((b, d) => (!b || d.amount > b.amount ? d : b), null);
    return { total, count, avg, best };
  }, [days]);

  const ticks = useMemo(() => niceTicks(Math.max(...days.map((d) => d.amount), 0)), [days]);
  const yMax = ticks[ticks.length - 1] || 1;
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const slot = days.length ? plotW / days.length : plotW;
  const gap = slot > 8 ? 2 : 1;
  const barW = Math.max(1, Math.min(MAX_BAR, slot - gap));
  const y = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const xCenter = (i: number) => M.left + slot * i + slot / 2;

  // Space date labels at least ~72px apart, always ending on today.
  const labelEvery = Math.max(1, Math.ceil(72 / slot));
  const xLabels = days.map((_, i) => i).filter((i) => (lastIndex - i) % labelEvery === 0);

  const activeDay = active != null ? days[active] : null;

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!days.length) return;
    const keys: Record<string, number> = {
      ArrowLeft: (active ?? lastIndex + 1) - 1,
      ArrowRight: (active ?? -1) + 1,
      Home: 0,
      End: lastIndex,
    };
    if (!(event.key in keys)) {
      if (event.key === "Escape") setActive(null);
      return;
    }
    event.preventDefault();
    setActive(Math.min(lastIndex, Math.max(0, keys[event.key])));
  }

  const describe = (d: Day, i: number) =>
    `${longDayLabel(d.date)}${i === lastIndex ? " (today, partial)" : ""}: ${formatUsd(d.amount)} across ${formatInt(d.count)} payouts`;

  return (
    <figure className="min-w-0 max-w-full border border-line bg-background" aria-labelledby={titleId}>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <span id={titleId} className="font-mono text-[13px] font-medium tracking-[0.04em] text-ink uppercase">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Range"
            options={RANGES.map((r) => ({ value: r, label: `${r}D` }))}
            value={range}
            onChange={(r) => {
              setRange(r);
              setActive(null);
            }}
          />
          <Segmented
            label="View"
            options={[
              { value: "chart" as const, label: "Chart" },
              { value: "table" as const, label: "Table" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </figcaption>

      <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        <Summary label={`Paid, last ${range} days`} value={formatUsd(stats.total)} />
        <Summary label="Payouts" value={formatInt(stats.count)} />
        <Summary label="Daily average" value={formatUsd(stats.avg)} sub="excludes today" />
        <Summary
          label="Best day"
          value={stats.best ? formatUsd(stats.best.amount) : "—"}
          sub={stats.best ? dayLabel(stats.best.date) : undefined}
        />
      </dl>

      {view === "chart" ? (
        <div className="px-3 pt-4 pb-3 md:px-5">
          <div
            ref={plotRef}
            className="relative outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
            tabIndex={0}
            role="group"
            aria-label={`${title}. Use the left and right arrow keys to read each day.`}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerLeave={() => setActive(null)}
          >
            <svg width={width} height={HEIGHT} className="block max-w-full touch-pan-y" aria-hidden="true">
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
                  <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-sub font-mono text-[11px]">
                    {formatUsdCompact(t)}
                  </text>
                </g>
              ))}

              {stats.avg > 0 && (
                <g>
                  <line
                    x1={M.left}
                    x2={width - M.right}
                    y1={y(stats.avg)}
                    y2={y(stats.avg)}
                    className="stroke-sub"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                  <text x={M.left + 6} y={y(stats.avg) - 6} className="fill-sub font-mono text-[11px]">
                    avg {formatUsdCompact(stats.avg)}/day
                  </text>
                </g>
              )}

              {days.map((d, i) => {
                const h = d.amount > 0 ? Math.max(2, M.top + plotH - y(d.amount)) : 0;
                const x = xCenter(i) - barW / 2;
                const isToday = i === lastIndex;
                const dim = active != null && active !== i;
                return (
                  <g key={d.date}>
                    {h > 0 && (
                      <path
                        d={barPath(x, M.top + plotH - h, barW, h)}
                        style={{ "--i": i } as React.CSSProperties}
                        className={cn(
                          "reveal-bar transition-opacity duration-150 motion-reduce:transition-none",
                          isToday ? "fill-signal/45" : "fill-signal",
                          dim && "opacity-35",
                        )}
                      />
                    )}
                    {/* Full-height hit target, wider than the bar. */}
                    <rect
                      x={M.left + slot * i}
                      y={M.top}
                      width={slot}
                      height={plotH}
                      fill="transparent"
                      onPointerEnter={() => setActive(i)}
                      onPointerDown={() => setActive(i)}
                    />
                  </g>
                );
              })}

              <line x1={M.left} x2={width - M.right} y1={M.top + plotH} y2={M.top + plotH} className="stroke-sub" strokeWidth={1} />

              {xLabels.map((i) => (
                <text
                  key={i}
                  x={xCenter(i)}
                  y={HEIGHT - 8}
                  textAnchor={i === lastIndex ? "end" : "middle"}
                  dx={i === lastIndex ? barW / 2 : 0}
                  className="fill-sub font-mono text-[11px]"
                >
                  {i === lastIndex ? "Today" : dayLabel(days[i].date)}
                </text>
              ))}
            </svg>

            {activeDay && active != null && (
              <Tooltip
                day={activeDay}
                isToday={active === lastIndex}
                avg={stats.avg}
                x={xCenter(active)}
                top={Math.max(M.top, y(activeDay.amount) - 8)}
                width={width}
              />
            )}
            <p className="sr-only" aria-live="polite">
              {activeDay && active != null ? describe(activeDay, active) : ""}
            </p>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-sub">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-[2px] bg-signal" /> USDC paid per day (UTC)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-[2px] bg-signal/45" /> Today, still counting
            </span>
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{`${title}, most recent first`}</caption>
            <thead className="sticky top-0 border-b border-line bg-paper font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Date (UTC)</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Paid</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Payouts</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Avg payout</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {days
                .map((d, i) => ({ d, i }))
                .reverse()
                .map(({ d, i }) => (
                  <tr key={d.date} className="border-b border-line last:border-b-0">
                    <th scope="row" className="px-5 py-2 font-normal text-ink">
                      {longDayLabel(d.date)}
                      {i === lastIndex && <span className="ml-2 text-sub">(partial)</span>}
                    </th>
                    <td className="px-5 py-2 text-right text-ink">{formatUsd(d.amount)}</td>
                    <td className="px-5 py-2 text-right text-sub">{formatInt(d.count)}</td>
                    <td className="px-5 py-2 text-right text-sub">{d.count ? formatUsd(d.amount / d.count, true) : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

function Tooltip({
  day,
  isToday,
  avg,
  x,
  top,
  width,
}: {
  day: Day;
  isToday: boolean;
  avg: number;
  x: number;
  top: number;
  width: number;
}) {
  const TW = 200;
  const left = Math.min(Math.max(0, x - TW / 2), width - TW);
  const vsAvg = avg > 0 && !isToday ? ((day.amount - avg) / avg) * 100 : null;
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-y-full border border-line bg-paper px-3 py-2.5 shadow-lg"
      style={{ left, top, width: TW }}
    >
      <div className="font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
        {longDayLabel(day.date)}
        {isToday && " · partial"}
      </div>
      <div className="tabular mt-1 font-heading text-[22px] leading-none font-medium tracking-[-0.02em] text-ink">
        {formatUsd(day.amount)}
      </div>
      <dl className="tabular mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[13px]">
        <dt className="text-sub">Payouts</dt>
        <dd className="text-right text-ink">{formatInt(day.count)}</dd>
        <dt className="text-sub">Avg payout</dt>
        <dd className="text-right text-ink">{day.count ? formatUsd(day.amount / day.count, true) : "—"}</dd>
        {vsAvg != null && (
          <>
            <dt className="text-sub">vs daily avg</dt>
            <dd className="text-right text-ink">
              {vsAvg >= 0 ? "+" : "−"}
              {Math.abs(vsAvg).toFixed(0)}%
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 border-line px-5 py-4 not-last:border-r max-md:even:border-r-0 max-md:[&:nth-child(-n+2)]:border-b">
      <dt className="meta">{label}</dt>
      <dd className="tabular mt-1.5 font-heading text-[20px] leading-none font-medium tracking-[-0.02em] text-ink md:text-[24px]">
        {value}
      </dd>
      {sub && <dd className="mt-1 font-mono text-[12px] text-sub">{sub}</dd>}
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-line">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-9 border-r border-line px-3 font-mono text-[12px] tracking-[0.04em] uppercase last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal",
            o.value === value ? "bg-ink text-background" : "text-sub hover:bg-paper hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
