import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Critter } from "@/components/payouts/leaderboard-podium";
import { ArrowIcon } from "@/components/ui/split-cta";
import { formatInt, formatUsd, formatUsdCompact, shortAddress } from "@/lib/format";
import { CHAINS } from "@/lib/payouts/chains";
import type { LeaderboardRow, Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

/**
 * Three doors off the home page. Each card has a drawn "image" built from
 * live data (the real top three, a real transfer), so it stays current
 * without stock art.
 */
export function ExploreCards({ top, wallets, proof }: { top: LeaderboardRow[]; wallets: number; proof: Payout | null }) {
  return (
    <ul className="grid gap-4 md:grid-cols-3 md:gap-5" data-reveal-children>
      <Card
        href="/leaderboard"
        accent="var(--gold)"
        eyebrow="The leaderboard"
        title="Who got paid the most?"
        figure={top[0] ? formatUsdCompact(top[0].total) : null}
        sub={top[0] ? `No. 1 all time · ${top[0].label ?? shortAddress(top[0].wallet ?? top[0].key, 4)}` : "All-time totals by wallet"}
        cta="See the top 50"
        art={<PodiumArt top={top} />}
      />
      <Card
        href="/rank"
        accent="var(--signal)"
        eyebrow="See your rank"
        title="Where does your wallet rank?"
        figure={`${formatInt(wallets)}`}
        sub="wallets ranked · make a card to share"
        cta="Enter your wallet"
        art={<RankArt />}
      />
      {proof?.chain && proof.txHash ? (
        <Card
          href="/payouts"
          accent="var(--green)"
          eyebrow="Verify a payout"
          title="Don't trust it. Check it on-chain."
          figure={formatUsd(proof.amount)}
          sub={`A real transfer on ${CHAINS[proof.chain].name}`}
          cta="Browse payout proof"
          art={<ReceiptArt payout={proof} />}
        />
      ) : (
        <Card
          href="/payouts"
          accent="var(--green)"
          eyebrow="Verify a payout"
          title="Don't trust it. Check it on-chain."
          figure={null}
          sub="Every payout links to its block explorer page."
          cta="Browse payout proof"
          art={null}
        />
      )}
    </ul>
  );
}

function Card({
  href,
  external,
  accent,
  eyebrow,
  title,
  figure,
  sub,
  cta,
  art,
}: {
  href: string;
  external?: boolean;
  accent: string;
  eyebrow: string;
  title: string;
  figure: string | null;
  sub: string;
  cta: string;
  art: ReactNode;
}) {
  const inner = (
    <>
      <div
        aria-hidden="true"
        className="relative aspect-[16/10] overflow-hidden border-b border-line bg-paper"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 50% 55%, color-mix(in oklab, var(--accent) 24%, transparent), transparent 65%)",
            "linear-gradient(to right, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
            "linear-gradient(to bottom, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 26px 26px, 26px 26px",
        }}
      >
        {art}
        <span className="absolute inset-x-0 bottom-0 h-1 bg-(--accent)" />
      </div>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-5">
        <p className="font-mono text-[12px] font-semibold tracking-[0.12em] text-(--accent) uppercase">{eyebrow}</p>
        <h3 className="mt-2 text-[22px] leading-tight font-medium tracking-[-0.02em] text-ink">{title}</h3>
        {figure && (
          <p className="tabular mt-4 font-heading text-[40px] leading-none font-medium tracking-[-0.04em] text-ink">{figure}</p>
        )}
        <p className="mt-2 truncate text-[14px] text-sub">{sub}</p>
        <span className="mt-6 flex items-center justify-between border border-line px-4 py-3 font-mono text-[12px] tracking-[0.06em] text-ink uppercase transition-colors group-hover:border-(--accent) group-hover:bg-background">
          {cta}
          <ArrowIcon>{external ? "↗" : "→"}</ArrowIcon>
        </span>
      </div>
    </>
  );
  const cls = "arrow-cta group flex h-full flex-col border border-line bg-background transition-colors hover:border-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)";
  return (
    <li style={{ "--accent": accent } as CSSProperties}>
      {external ? (
        <a href={href} target="_blank" rel="noopener nofollow" className={cls}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      )}
    </li>
  );
}

const hop = "transition-transform duration-500 ease-out group-hover:-translate-y-2 motion-reduce:transition-none";

/** The real top three as critters on a 2 · 1 · 3 podium. */
function PodiumArt({ top }: { top: LeaderboardRow[] }) {
  const order = [1, 0, 2];
  const medal = ["var(--gold)", "var(--silver)", "var(--bronze)"];
  const height = ["h-[34%]", "h-[24%]", "h-[16%]"];
  return (
    <div className="absolute inset-x-[10%] bottom-1 flex items-end justify-center gap-[3%]">
      {order.map((i) => {
        const row = top[i];
        if (!row) return null;
        return (
          <div key={row.key} className="flex h-full w-1/3 flex-col items-center justify-end" style={{ "--medal": medal[i] } as CSSProperties}>
            <Critter
              seed={row.wallet ?? row.key}
              crowned={i === 0}
              className={cn("w-[78%]", hop)}
            />
            <div
              className={cn(
                "relative mt-1 flex w-full items-start justify-center border border-b-0 border-line bg-background pt-1.5",
                height[i],
              )}
              style={{ minHeight: [52, 38, 28][i] }}
            >
              <span className="font-heading text-[22px] leading-none font-medium text-(--medal)">{i + 1}</span>
              <span className="absolute inset-x-0 top-0 h-1 bg-(--medal)" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A tilted mini rank card with an unknown rank. */
function RankArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="relative w-[72%] -rotate-3 border border-line bg-background p-3 shadow-[6px_6px_0_0_var(--accent)] transition-transform duration-500 ease-out group-hover:rotate-0 motion-reduce:transition-none"
        style={{ "--medal": "var(--signal)" } as CSSProperties}
      >
        <p className="font-mono text-[8px] font-semibold tracking-[0.14em] text-(--accent) uppercase">All-time rank · Vest payouts</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="font-heading text-[52px] leading-[0.9] font-medium tracking-[-0.05em] text-(--accent)">
            <span className="align-top text-[28px] opacity-70">#</span>?
          </p>
          <Critter seed="0x7e57c0de5a1bd00d1e5f0a77ab1e5eedc0ffee42" crowned={false} className={cn("w-[34%]", hop)} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** A transfer receipt for a real payout. */
function ReceiptArt({ payout }: { payout: Payout }) {
  const chain = payout.chain ? CHAINS[payout.chain] : null;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-[76%] rotate-2 border border-line bg-background font-mono text-[10px] text-sub shadow-[6px_6px_0_0_var(--accent)] transition-transform duration-500 ease-out group-hover:rotate-0 motion-reduce:transition-none">
        <div className="flex items-center justify-between border-b border-dashed border-line px-3 py-2">
          <span className="tracking-[0.1em] text-ink uppercase">USDC transfer</span>
          <span className="flex items-center gap-1 text-green">
            <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true">
              <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
            </svg>
            Confirmed
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2">
          <dt>From</dt>
          <dd className="truncate text-right text-ink">Vest payout contract</dd>
          <dt>To</dt>
          <dd className="truncate text-right text-ink">{payout.wallet ? shortAddress(payout.wallet, 4) : "—"}</dd>
          <dt>Network</dt>
          <dd className="truncate text-right text-ink">{chain?.name ?? "—"}</dd>
          <dt>Tx</dt>
          <dd className="truncate text-right text-ink">{payout.txHash ? shortAddress(payout.txHash, 6) : "—"}</dd>
        </dl>
        <div className="flex items-baseline justify-between border-t border-dashed border-line px-3 py-2">
          <span className="tracking-[0.1em] uppercase">Amount</span>
          <span className="font-heading text-[18px] leading-none font-medium tracking-[-0.03em] text-green">{formatUsd(payout.amount)}</span>
        </div>
      </div>
    </div>
  );
}
