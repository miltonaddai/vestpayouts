import Link from "next/link";
import type { CSSProperties } from "react";
import { ExternalLink, Trophy } from "lucide-react";
import { CHAINS, txUrl } from "@/lib/payouts/chains";
import { ArrowIcon } from "@/components/ui/split-cta";
import { formatDate, formatUsd, shortAddress, timeAgo } from "@/lib/format";
import { payoutRoute } from "@/lib/payouts/routes";
import type { Payout } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";
import { ChainBadge } from "./chain-badge";
import { TimeAgo } from "./time-ago";

const PROOF_BUTTON =
  "inline-flex min-h-11 items-center gap-2 border border-ink bg-background px-4 font-mono text-[13px] tracking-[0.04em] text-ink uppercase transition-colors hover:bg-ink hover:text-background";

/**
 * "Award" card for the single largest payout on record: gold plate, the amount
 * as the headline, who received it and a link to its proof.
 */
export function RecordPayoutCard({ payout, average, className }: { payout: Payout; average: number; className?: string }) {
  const name = payout.walletLabel ?? payout.trader ?? (payout.wallet ? shortAddress(payout.wallet, 4) : "Unknown trader");
  const multiple = average > 0 ? Math.round(payout.amount / average) : 0;
  // On-chain rows open the block explorer; reported rows open their public post.
  const proof =
    payout.chain && payout.txHash
      ? { href: txUrl(payout.chain, payout.txHash), label: `View on ${CHAINS[payout.chain].explorerName}` }
      : payout.proofUrl
        ? { href: payout.proofUrl, label: "View proof" }
        : null;

  return (
    <article
      aria-labelledby="record-payout-title"
      style={{ "--medal": "var(--gold)" } as CSSProperties}
      className={cn("relative flex min-w-0 flex-col overflow-hidden border border-line bg-paper", className)}
    >
      {/* Plate: grid paper with a gold glow and an oversized outlined trophy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 82% 38%, color-mix(in oklab, var(--medal) 24%, transparent), transparent 55%)",
            "linear-gradient(to right, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
            "linear-gradient(to bottom, color-mix(in oklab, var(--line) 70%, transparent) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
      />
      <Trophy
        aria-hidden="true"
        strokeWidth={0.75}
        className="pointer-events-none absolute top-1/2 right-[-4%] size-[62%] max-h-72 -translate-y-1/2 text-(--medal) opacity-15 sm:right-[4%] sm:opacity-35 sm:size-[46%]"
      />

      <div className="relative flex flex-1 flex-col p-5 sm:p-7 md:p-8">
        <p className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tracking-[0.12em] text-(--medal) uppercase">
          <Trophy className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
          Largest single payout · All time
        </p>
        <h2 id="record-payout-title" className="sr-only">
          Largest single Vest payout recorded
        </h2>

        <p className="tabular mt-6 font-heading text-[44px] leading-[0.9] font-medium tracking-[-0.04em] text-ink sm:text-[64px] md:text-[76px]">
          {formatUsd(payout.amount)}
        </p>
        {multiple > 1 && (
          <p className="mt-3 text-[15px] text-sub">
            One transaction · <span className="font-medium text-ink">{multiple.toLocaleString()}×</span> the average payout
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
          <div className="min-w-0">
            <p className="meta">Paid to</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2">
              {payout.wallet ? (
                <Link
                  href={`/wallets/${payout.wallet}`}
                  className={cn("text-[18px] font-medium text-ink hover:text-signal", !(payout.walletLabel ?? payout.trader) && "font-mono")}
                >
                  {name}
                </Link>
              ) : (
                <span className="text-[18px] font-medium text-ink">{name}</span>
              )}
              <ChainBadge payout={payout} />
            </p>
            <p className="mt-1.5 text-[13px] text-sub">
              {formatDate(payout.paidAt)} · <TimeAgo ms={payout.paidAt} initial={timeAgo(payout.paidAt)} />
            </p>
          </div>
          {proof ? (
            <a
              href={proof.href}
              target="_blank"
              rel="noopener nofollow"
              className={PROOF_BUTTON}
              aria-label={`${proof.label} (opens in a new tab)`}
            >
              {proof.label}
              <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : (
            <Link href={payoutRoute(payout)} className={PROOF_BUTTON}>
              View details
              <ArrowIcon />
            </Link>
          )}
        </div>
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-(--medal)" />
    </article>
  );
}

/** One row of the vertical metrics column beside the record card. */
export function StackedStat({ label, value, tone = "ink" }: { label: string; value: React.ReactNode; tone?: "ink" | "signal" | "green" | "orange" }) {
  const color = { ink: "text-ink", signal: "text-signal", green: "text-green", orange: "text-orange" }[tone];
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0 md:px-6">
      <dt className="meta font-semibold text-ink">{label}</dt>
      <dd className={cn("tabular truncate font-heading text-[24px] leading-none font-medium tracking-[-0.03em] md:text-[30px]", color)}>{value}</dd>
    </div>
  );
}
