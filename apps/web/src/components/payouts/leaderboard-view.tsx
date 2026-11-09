import Link from "next/link";
import { Trophy } from "lucide-react";
import { VestHeroHeading } from "@/components/brand/vest-hero-icon";
import { SampleDataBanner } from "@/components/payouts/sample-banner";
import { LeaderboardPodium } from "@/components/payouts/leaderboard-podium";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { formatDate, formatInt, formatUsd, shortAddress } from "@/lib/format";
import { getLeaderboard, getSummary } from "@/lib/payouts/repository";
import { absoluteUrl } from "@/lib/site";
import { PERIOD_LABEL, type Period } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

/** Ranks 1-3: trophy color, row tint and left accent. Ranks 4-10 share a lighter highlight. */
const MEDALS = [
  { label: "1st place", text: "text-gold", row: "bg-gold/[0.07] shadow-[inset_3px_0_0_var(--gold)]" },
  { label: "2nd place", text: "text-silver", row: "bg-silver/[0.07] shadow-[inset_3px_0_0_var(--silver)]" },
  { label: "3rd place", text: "text-bronze", row: "bg-bronze/[0.07] shadow-[inset_3px_0_0_var(--bronze)]" },
] as const;
const TOP = 10;

function Rank({ rank }: { rank: number }) {
  const medal = MEDALS[rank - 1];
  if (medal) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-mono font-semibold", medal.text)}>
        <Trophy className="size-4" strokeWidth={2.25} aria-hidden="true" />
        <span aria-hidden="true">{rank}</span>
        <span className="sr-only">{medal.label}</span>
      </span>
    );
  }
  return <span className={cn("font-mono", rank <= TOP ? "font-medium text-ink" : "text-sub")}>{rank}</span>;
}

const TABS: { period: Period; href: string; short: string }[] = [
  { period: "all", href: "/leaderboard", short: "All" },
  { period: "30d", href: "/leaderboard/30d", short: "30d" },
  { period: "7d", href: "/leaderboard/7d", short: "7d" },
  { period: "24h", href: "/leaderboard/24h", short: "24h" },
];

export async function LeaderboardView({ period }: { period: Period }) {
  const [rows, summary] = await Promise.all([getLeaderboard(period, 50), getSummary()]);
  const window = summary.windows[period];
  return (
    <>
      {summary.isSample && <SampleDataBanner />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Vest payout leaderboard — ${PERIOD_LABEL[period].toLowerCase()}`,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: rows.length,
          itemListElement: rows.slice(0, 10).map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.label || (r.wallet ? shortAddress(r.wallet, 6) : "Trader"),
            url: r.wallet ? absoluteUrl(`/wallets/${r.wallet}`) : undefined,
          })),
        }}
      />
      <div className="px-6 pt-8 md:px-14">
        <Breadcrumbs items={[{ name: "Leaderboard", path: "/leaderboard" }]} />
        <p className="meta mt-6">§ 00 — Rankings</p>
        <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">
          <VestHeroHeading>Vest payout leaderboard</VestHeroHeading>
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-sub">
          Traders ranked by USDC received from Vest
          {period === "all" ? "" : ` in the ${PERIOD_LABEL[period].toLowerCase()}`}.
        </p>
        <p className="mt-3 max-w-2xl text-[15px] text-sub">
          <span className="tabular font-medium text-ink">{formatUsd(window.amount)}</span> paid across{" "}
          <span className="tabular text-ink">{formatInt(window.count)}</span> payouts to{" "}
          <span className="tabular text-ink">{formatInt(window.wallets)}</span> wallets
          {window.largest && (
            <>
              {" "}
              · largest single payout <span className="tabular text-ink">{formatUsd(window.largest.amount)}</span>
            </>
          )}
          .
        </p>

        <LeaderboardPodium rows={rows} period={period} />

        <nav aria-label="Leaderboard period" className="mt-8 grid grid-cols-4 border border-line sm:flex">
          {TABS.map((t) => (
            <Link
              key={t.period}
              href={t.href}
              aria-current={t.period === period ? "page" : undefined}
              aria-label={PERIOD_LABEL[t.period]}
              className={cn(
                "inline-flex min-h-11 items-center justify-center border-r border-line px-2 py-2.5 font-mono text-[13px] tracking-[0.04em] whitespace-nowrap uppercase last:border-r-0 sm:justify-start sm:px-4",
                t.period === period ? "bg-ink text-background" : "bg-background text-sub hover:text-ink",
              )}
            >
              {/* Phones: one row of short labels. sm and up: unchanged. */}
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{PERIOD_LABEL[t.period]}</span>
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <p className="mt-8 border border-dashed border-line px-6 py-14 text-center text-sub">No payouts in this window yet.</p>
        ) : (
          <div className="mt-0 min-w-0 max-w-full overflow-x-auto border border-t-0 border-line bg-background">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Top Vest payout recipients, {PERIOD_LABEL[period].toLowerCase()}</caption>
              <thead className="border-b border-line bg-paper font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Trader</th>
                  <th className="px-4 py-3 text-right font-medium">Total received</th>
                  <th className="px-4 py-3 text-right font-medium">Payouts</th>
                  <th className="px-4 py-3 text-right font-medium">Largest</th>
                  <th className="px-4 py-3 text-right font-medium">Last paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => (
                  <tr
                    key={r.key}
                    className={cn(
                      "reveal-row hover:bg-paper",
                      MEDALS[i]?.row,
                      i >= MEDALS.length && i < TOP && "bg-paper/50",
                      // Heavier rule under the top 10.
                      i === TOP - 1 && rows.length > TOP && "border-b-2 border-b-line",
                    )}
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Rank rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      {r.wallet ? (
                        <Link href={`/wallets/${r.wallet}`} className="font-mono text-ink hover:text-signal">
                          {r.label && <span className="mr-2 font-sans font-medium">{r.label}</span>}
                          {shortAddress(r.wallet, 6)}
                        </Link>
                      ) : (
                        <span className="text-ink">{r.label ?? "Unknown trader"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-green">{formatUsd(r.total, true)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatInt(r.count)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatUsd(r.largest, true)}</td>
                    <td className="px-4 py-3 text-right text-sub">{formatDate(r.lastPaidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 mb-4">
          <ReferralPanel placement="leaderboard" title="Get on the next leaderboard" />
        </div>
      </div>
    </>
  );
}
