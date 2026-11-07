import Link from "next/link";
import { VestInlineLogo } from "@/components/brand/vest-inline-logo";
import { SampleDataBanner } from "@/components/payouts/sample-banner";
import { Stat, StatGrid } from "@/components/payouts/stat-grid";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { formatDate, formatInt, formatUsd, shortAddress } from "@/lib/format";
import { getLeaderboard, getSummary } from "@/lib/payouts/repository";
import { absoluteUrl } from "@/lib/site";
import { PERIOD_LABEL, type Period } from "@/lib/payouts/types";
import { cn } from "@/lib/utils";

const TABS: { period: Period; href: string }[] = [
  { period: "all", href: "/leaderboard" },
  { period: "30d", href: "/leaderboard/30d" },
  { period: "7d", href: "/leaderboard/7d" },
  { period: "24h", href: "/leaderboard/24h" },
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
        <h1 className="mt-3 text-[36px] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">
          Vest payout leaderboard
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-sub">
          Traders ranked by USDC they received from <VestInlineLogo placement="inline-logo" />{" "}
          {period === "all" ? "since tracking began" : PERIOD_LABEL[period].toLowerCase()}.
          Wallets are public addresses from payout transactions. Names appear only when a trader has been identified.
        </p>
        <StatGrid className="mt-8">
          <Stat label={`Paid · ${PERIOD_LABEL[period]}`} value={formatUsd(window.amount)} highlight />
          <Stat label="Payouts" value={formatInt(window.count)} tone="green" />
          <Stat label="Wallets" value={formatInt(window.wallets)} tone="orange" />
          <Stat label="Largest" value={window.largest ? formatUsd(window.largest.amount) : "—"} />
        </StatGrid>

        <nav aria-label="Leaderboard period" className="mt-8 flex flex-wrap border border-line">
          {TABS.map((t) => (
            <Link
              key={t.period}
              href={t.href}
              aria-current={t.period === period ? "page" : undefined}
              className={cn(
                "border-r border-line px-4 py-2.5 font-mono text-[12px] tracking-[0.04em] uppercase last:border-r-0",
                t.period === period ? "bg-ink text-background" : "bg-background text-sub hover:text-ink",
              )}
            >
              {PERIOD_LABEL[t.period]}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <p className="mt-8 border border-dashed border-line px-6 py-14 text-center text-sub">No payouts in this window yet.</p>
        ) : (
          <div className="mt-0 min-w-0 max-w-full overflow-x-auto border border-t-0 border-line bg-background">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Top Vest payout recipients, {PERIOD_LABEL[period].toLowerCase()}</caption>
              <thead className="border-b border-line bg-paper font-mono text-[11px] tracking-[0.04em] text-sub uppercase">
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
                  <tr key={r.key} className="hover:bg-paper">
                    <td className="px-4 py-3 font-mono text-sub">{i + 1}</td>
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
