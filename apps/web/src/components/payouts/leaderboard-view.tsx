import Link from "next/link";
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
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: "Leaderboard", path: "/leaderboard" }]} />
        <h1 className="mt-5 text-3xl font-bold text-paper sm:text-4xl">Vest payout leaderboard</h1>
        <p className="mt-3 max-w-2xl text-paper/75">
          Traders ranked by USDC they received from Vest {period === "all" ? "since tracking began" : PERIOD_LABEL[period].toLowerCase()}.
          Wallets are public addresses from payout transactions. Names appear only when a trader has been identified.
        </p>
        <StatGrid className="mt-8">
          <Stat label={`Paid · ${PERIOD_LABEL[period]}`} value={formatUsd(window.amount)} highlight />
          <Stat label="Payouts" value={formatInt(window.count)} />
          <Stat label="Wallets" value={formatInt(window.wallets)} />
          <Stat label="Largest" value={window.largest ? formatUsd(window.largest.amount) : "—"} />
        </StatGrid>

        <nav aria-label="Leaderboard period" className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.period}
              href={t.href}
              aria-current={t.period === period ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                t.period === period ? "border-mint/40 bg-mint/15 text-mint" : "border-ink-700 text-paper/70 hover:text-paper",
              )}
            >
              {PERIOD_LABEL[t.period]}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ink-700 px-6 py-14 text-center text-paper/70">
            No payouts in this window yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-800 bg-ink-900/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Top Vest payout recipients, {PERIOD_LABEL[period].toLowerCase()}</caption>
              <thead className="border-b border-ink-800 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Trader</th>
                  <th className="px-4 py-3 text-right font-medium">Total received</th>
                  <th className="px-4 py-3 text-right font-medium">Payouts</th>
                  <th className="px-4 py-3 text-right font-medium">Largest</th>
                  <th className="px-4 py-3 text-right font-medium">Last paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {rows.map((r, i) => (
                  <tr key={r.key} className="hover:bg-ink-850/70">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      {r.wallet ? (
                        <Link href={`/wallets/${r.wallet}`} className="font-mono text-paper hover:text-mint">
                          {r.label && <span className="mr-2 font-sans font-medium">{r.label}</span>}
                          {shortAddress(r.wallet, 6)}
                        </Link>
                      ) : (
                        <span className="text-paper">{r.label ?? "Unknown trader"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-mint">{formatUsd(r.total, true)}</td>
                    <td className="px-4 py-3 text-right font-mono text-paper/80">{formatInt(r.count)}</td>
                    <td className="px-4 py-3 text-right font-mono text-paper/80">{formatUsd(r.largest, true)}</td>
                    <td className="px-4 py-3 text-right text-paper/70">{formatDate(r.lastPaidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12">
          <ReferralPanel placement="leaderboard" title="Get on the next leaderboard" />
        </div>
      </div>
    </>
  );
}
