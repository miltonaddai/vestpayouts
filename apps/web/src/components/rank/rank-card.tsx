"use client";

import { forwardRef, useEffect, useState, type CSSProperties } from "react";
import { Trophy } from "lucide-react";
import type { RankResponse } from "@/app/api/rank/route";
import { Critter } from "@/components/payouts/leaderboard-podium";
import { formatDate, formatInt, formatUsd, shortAddress } from "@/lib/format";

/**
 * Design size: square, so it fills a phone feed on X, Instagram and the rest.
 * The card is laid out at this size and scaled to fit, so the downloaded PNG
 * (2x, 1200x1200) never depends on screen width.
 */
export const CARD_W = 600;
export const CARD_H = 600;

export interface Tier {
  color: string;
  label: string;
}

export function tierFor(rank: number | null, wallets: number): Tier {
  if (rank === 1) return { color: "var(--gold)", label: "Gold · No. 1" };
  if (rank === 2) return { color: "var(--silver)", label: "Silver · No. 2" };
  if (rank === 3) return { color: "var(--bronze)", label: "Bronze · No. 3" };
  if (rank === null) return { color: "var(--orange)", label: "Outside the top 500" };
  if (rank <= 10) return { color: "var(--signal)", label: "Top 10" };
  if (rank <= 100) return { color: "var(--green)", label: "Top 100" };
  const pct = (rank / Math.max(wallets, 1)) * 100;
  const shown = pct < 1 ? Math.max(0.1, Math.ceil(pct * 10) / 10) : Math.ceil(pct);
  return { color: "var(--orange)", label: `Top ${shown}%` };
}

/** Counts down from the number of wallets to the rank, easing out, like a slot reel settling. */
function useCountdown(to: number | null, from: number) {
  const [value, setValue] = useState(to === null ? null : from);
  useEffect(() => {
    if (to === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const delay = 300;
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, Math.max(0, (now - start - delay) / duration));
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(t >= 1 ? to : Math.max(to, Math.round(from - (from - to) * eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from]);
  return value;
}

const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 120 + (i % 3) * 45;
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist * 0.7 - 30, rot: (i % 2 ? 1 : -1) * (180 + i * 20), size: 6 + (i % 3) * 2 };
});

export const RankCard = forwardRef<HTMLDivElement, { data: RankResponse; name: string; handle: string }>(function RankCard(
  { data, name, handle },
  ref,
) {
  const tier = tierFor(data.rank, data.wallets);
  // Reel starts a little above the rank (≈8×, at least 50, at most the wallet count).
  const from = data.rank === null ? 0 : Math.min(data.wallets, Math.max(data.rank * 8, 50));
  const shown = useCountdown(data.rank, from);
  const custom = name.trim() || data.label;
  const title = custom || shortAddress(data.wallet, 4);
  const at = handle.trim().replace(/^@+/, "");
  const confetti = data.rank !== null && data.rank <= 10;
  const rankText = data.rank === null ? "500+" : formatInt(shown ?? data.rank);
  // Size by the widest number the countdown passes through, so the text doesn't jump or hit the critter.
  const widest = data.rank === null ? 4 : formatInt(from).length;
  const rankSize = widest <= 3 ? 112 : widest <= 5 ? 88 : 72;
  // Share of paid wallets this one is ahead of, for the segmented bar.
  const ahead = data.rank === null ? null : Math.max(0, Math.floor(((data.wallets - data.rank) / Math.max(data.wallets, 1)) * 100));
  const lit = ahead === null ? 0 : Math.max(1, Math.round(ahead / 5));

  return (
    <div
      ref={ref}
      className="rank-card-in relative overflow-hidden border border-line bg-background text-ink"
      style={{ width: CARD_W, height: CARD_H, "--medal": tier.color } as CSSProperties}
    >
      {/* Grid paper and a glow behind the critter. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 76% 30%, color-mix(in oklab, var(--medal) 30%, transparent), transparent 48%)",
            "linear-gradient(to right, color-mix(in oklab, var(--line) 65%, transparent) 1px, transparent 1px)",
            "linear-gradient(to bottom, color-mix(in oklab, var(--line) 65%, transparent) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 30px 30px, 30px 30px",
        }}
      />

      {/* Header row */}
      <div className="rank-rise absolute top-7 right-8 left-8 flex items-center justify-between" style={{ "--d": 0 } as CSSProperties}>
        <p className="flex items-center gap-2 font-mono text-[13px] font-semibold tracking-[0.14em] text-(--medal) uppercase">
          <Trophy className="size-4" strokeWidth={2.25} aria-hidden="true" />
          All-time rank · Vest payouts
        </p>
        <p className="font-mono text-[12px] tracking-[0.06em] text-sub uppercase">{formatDate(data.asOf)}</p>
      </div>

      {/* Rank */}
      <div className="absolute top-[84px] left-8">
        <p
          className="tabular font-heading leading-[0.9] font-medium tracking-[-0.05em] whitespace-nowrap text-(--medal)"
          style={{ fontSize: rankSize }}
        >
          <span className="align-top opacity-70" style={{ fontSize: rankSize * 0.57 }}>
            #
          </span>
          {rankText}
        </p>
        <p className="rank-rise mt-3 text-[16px] text-sub" style={{ "--d": 1 } as CSSProperties}>
          {data.rank === null ? (
            <>of {formatInt(data.wallets)} wallets paid</>
          ) : (
            <>
              of <span className="text-ink">{formatInt(data.wallets)}</span> wallets ·{" "}
              <span className="font-medium text-(--medal)">{tier.label}</span>
            </>
          )}
        </p>
      </div>

      {/* Identity */}
      <div className="rank-rise absolute top-[290px] right-8 left-8" style={{ "--d": 2 } as CSSProperties}>
        <p className={`truncate text-[34px] leading-tight font-medium tracking-[-0.02em] text-ink ${custom ? "" : "font-mono"}`}>{title}</p>
        {(at || custom) && (
          <p className="mt-1.5 flex items-center gap-3 font-mono text-[15px] text-sub">
            {at && <span className="text-ink">@{at}</span>}
            {custom && <span>{shortAddress(data.wallet, 4)}</span>}
          </p>
        )}
      </div>

      {/* Critter */}
      <div className="absolute top-[64px] right-7 size-[220px]">
        <div className="rank-pop size-full">
          <Critter seed={data.wallet} crowned={data.rank === 1} className="size-full" />
        </div>
      </div>

      {/* Where this wallet stands: 20 segments, 5% each. */}
      {ahead !== null && (
        <div className="rank-rise absolute top-[392px] right-8 left-8" style={{ "--d": 3 } as CSSProperties}>
          <p className="font-mono text-[12px] tracking-[0.1em] text-sub uppercase">
            Ahead of <span className="text-(--medal)">{ahead}%</span> of paid wallets
          </p>
          <div className="mt-2.5 flex gap-1" aria-hidden="true">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className={`h-4 flex-1 ${i < lit ? "bg-(--medal)" : "bg-line"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <dl className="absolute right-8 bottom-14 left-8 grid grid-cols-3 gap-x-4 border-t border-line pt-5">
        {[
          ["Total received", formatUsd(data.total)],
          ["Payouts", formatInt(data.count)],
          ["Largest payout", formatUsd(data.largest)],
        ].map(([label, value], i) => (
          <div key={label} className="rank-rise" style={{ "--d": 4 + i } as CSSProperties}>
            <dt className="font-mono text-[11px] tracking-[0.1em] text-sub uppercase">{label}</dt>
            <dd className="tabular mt-2 font-heading text-[26px] leading-none font-medium tracking-[-0.03em] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Footer: quiet site credit above the medal bar. */}
      <p className="absolute right-8 bottom-4 font-mono text-[11px] tracking-[0.12em] text-sub opacity-70">vestpayouts.com</p>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-(--medal)" />

      {/* One-off effects, left out of the downloaded image. */}
      <span
        aria-hidden="true"
        data-export-ignore
        className="rank-shine pointer-events-none absolute inset-y-0 left-0 w-1/3"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, white 22%, transparent), transparent)" }}
      />
      {confetti &&
        CONFETTI.map((c, i) => (
          <span
            key={i}
            aria-hidden="true"
            data-export-ignore
            className="rank-confetti pointer-events-none absolute"
            style={
              {
                top: 170,
                right: 130,
                width: c.size,
                height: c.size,
                background: i % 3 === 0 ? "var(--ink)" : "var(--medal)",
                "--dx": `${c.dx}px`,
                "--dy": `${c.dy}px`,
                "--rot": `${c.rot}deg`,
                "--d": i,
              } as CSSProperties
            }
          />
        ))}
    </div>
  );
});
