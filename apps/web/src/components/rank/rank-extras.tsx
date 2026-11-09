import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Critter } from "@/components/payouts/leaderboard-podium";
import { formatInt, formatUsdCompact, shortAddress } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

const GRID_BG = {
  backgroundImage: [
    "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--accent) 24%, transparent), transparent 65%)",
    "linear-gradient(to right, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
    "linear-gradient(to bottom, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "100% 100%, 22px 22px, 22px 22px",
};

const RUNGS = [
  { rank: 1, label: "No. 1", color: "var(--gold)" },
  { rank: 3, label: "Top 3", color: "var(--bronze)" },
  { rank: 10, label: "Top 10", color: "var(--signal)" },
  { rank: 100, label: "Top 100", color: "var(--green)" },
  { rank: 500, label: "Top 500", color: "var(--orange)" },
];

/**
 * Fills the rank page before a lookup: the real totals needed to reach each
 * tier, and how the card works. Built from live leaderboard rows.
 */
export function RankExtras({ board, wallets }: { board: LeaderboardRow[]; wallets: number }) {
  const rungs = RUNGS.filter((r) => board[r.rank - 1]).map((r) => ({ ...r, row: board[r.rank - 1] }));

  return (
    <div className="mt-10 grid gap-12">
      {rungs.length > 0 && (
        <section aria-labelledby="bar-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="meta">The bar to beat</p>
              <h2 id="bar-title" className="mt-2 text-[24px] leading-tight font-medium tracking-[-0.02em] text-ink md:text-[28px]">
                What it takes to make each tier
              </h2>
            </div>
            <p className="text-[14px] text-sub">
              All-time USDC received · {formatInt(wallets)} wallets paid
            </p>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4" data-reveal-children>
            {rungs.map(({ rank, label, color, row }) => (
              <li key={rank} style={{ "--accent": color } as CSSProperties}>
                <Link
                  href={row.wallet ? `/wallets/${row.wallet}` : "/leaderboard"}
                  className="group flex h-full flex-col border border-line bg-background transition-colors hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                >
                  <div aria-hidden="true" className="relative flex aspect-[4/3] items-end justify-center overflow-hidden border-b border-line bg-paper" style={GRID_BG}>
                    <Critter
                      seed={row.wallet ?? row.key}
                      crowned={rank === 1}
                      className="mb-2 w-[46%] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none"
                    />
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-(--accent)" />
                  </div>
                  <div className="px-4 pt-3.5 pb-4">
                    <p className="font-mono text-[12px] font-semibold tracking-[0.12em] text-(--accent) uppercase">{label}</p>
                    <p className="tabular mt-1.5 font-heading text-[28px] leading-none font-medium tracking-[-0.03em] text-ink">
                      {formatUsdCompact(row.total)}
                    </p>
                    <p className="mt-1.5 truncate text-[13px] text-sub">
                      {rank === 1 ? "held by" : `No. ${rank} today ·`} {row.label ?? shortAddress(row.wallet ?? row.key, 4)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="how-title">
        <p className="meta">How it works</p>
        <h2 id="how-title" className="mt-2 text-[24px] leading-tight font-medium tracking-[-0.02em] text-ink md:text-[28px]">
          Your rank card in three steps
        </h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3 md:gap-5" data-reveal-children>
          <Step n="01" accent="var(--signal)" title="Paste your wallet" body="The address Vest sends your USDC payouts to." art={<PasteArt />} />
          <Step n="02" accent="var(--green)" title="Make it yours" body="Add a name and X handle. Both are optional and never saved." art={<NameArt />} />
          <Step n="03" accent="var(--gold)" title="Download and share" body="A square 1200 × 1200 image, sized for phone feeds." art={<ShareArt />} />
        </ol>
      </section>
    </div>
  );
}

function Step({ n, accent, title, body, art }: { n: string; accent: string; title: string; body: string; art: ReactNode }) {
  return (
    <li className="flex flex-col border border-line bg-background" style={{ "--accent": accent } as CSSProperties}>
      <div aria-hidden="true" className="relative aspect-[16/9] overflow-hidden border-b border-line bg-paper" style={GRID_BG}>
        {art}
        <span className="absolute inset-x-0 bottom-0 h-1 bg-(--accent)" />
      </div>
      <div className="px-5 pt-4 pb-5">
        <p className="font-mono text-[12px] font-semibold tracking-[0.12em] text-(--accent) uppercase">Step {n}</p>
        <h3 className="mt-1.5 text-[20px] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
        <p className="mt-1.5 text-[14px] leading-[1.55] text-sub">{body}</p>
      </div>
    </li>
  );
}

const tilt = "transition-transform duration-500 ease-out motion-reduce:transition-none";

function PasteArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={cn("w-[78%] -rotate-2 border border-line bg-background p-3 shadow-[5px_5px_0_0_var(--accent)]", tilt)}>
        <p className="font-mono text-[8px] tracking-[0.12em] text-sub uppercase">Wallet address</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="flex-1 truncate border border-line px-2 py-1.5 font-mono text-[11px] text-ink">
            0x7e57…ee42<span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-ink" />
          </span>
          <span className="bg-(--accent) px-2 py-1.5 font-mono text-[9px] font-semibold tracking-[0.08em] text-background uppercase">Go</span>
        </div>
      </div>
    </div>
  );
}

function NameArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-4">
      <Critter seed="0x5eedfacecafe0b0e5a1ad1234567890abcdef12" crowned={false} className="w-[22%]" />
      <div className={cn("w-[48%] rotate-2 border border-line bg-background p-3 shadow-[5px_5px_0_0_var(--accent)]", tilt)}>
        <p className="text-[15px] leading-tight font-medium text-ink">Your name</p>
        <p className="mt-0.5 font-mono text-[11px] text-(--accent)">@yourhandle</p>
        <div className="mt-2 grid gap-1">
          <span className="h-1.5 w-full bg-line" />
          <span className="h-1.5 w-2/3 bg-line" />
        </div>
      </div>
    </div>
  );
}

function ShareArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={cn("relative aspect-square h-[70%] -rotate-3 border border-line bg-background p-2.5 shadow-[5px_5px_0_0_var(--accent)]", tilt)}
        style={{ "--medal": "var(--accent)" } as CSSProperties}
      >
        <p className="font-mono text-[6px] font-semibold tracking-[0.14em] text-(--accent) uppercase">All-time rank</p>
        <p className="font-heading text-[30px] leading-[0.95] font-medium tracking-[-0.05em] text-(--accent)">
          <span className="align-top text-[16px] opacity-70">#</span>?
        </p>
        <div className="absolute right-2 bottom-3 left-2 flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1", i < 7 ? "bg-(--accent)" : "bg-line")} />
          ))}
        </div>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-(--accent)" />
      </div>
      <span className="ml-4 border border-line bg-background px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] text-ink uppercase">↓ PNG</span>
    </div>
  );
}
