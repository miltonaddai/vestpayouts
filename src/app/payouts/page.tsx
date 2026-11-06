import Link from "next/link";
import { Suspense } from "react";
import { PayoutExplorer } from "@/components/payouts/payout-explorer";
import { PayoutTable } from "@/components/payouts/payout-table";
import { SampleDataBanner } from "@/components/payouts/sample-banner";
import { Stat, StatGrid } from "@/components/payouts/stat-grid";
import { ReferralPanel } from "@/components/referral/referral-cta";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { formatDate, formatInt, formatUsd } from "@/lib/format";
import { getSummary, queryPayouts } from "@/lib/payouts/repository";
import { datasetLd, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "All Vest Payouts — Latest & Largest Vest Payout Proof",
  description:
    "Browse every Vest payout with on-chain proof. Filter by chain, date and amount, search a wallet, and open any payout's transaction on BaseScan or Arbiscan.",
  path: "/payouts",
  keywords: ["Vest payouts", "Vest payout list", "Vest payout proof", "largest Vest payouts"],
});

export default async function PayoutsPage() {
  const [summary, initial] = await Promise.all([getSummary(), queryPayouts({ page: 1 })]);
  return (
    <>
      {summary.isSample && <SampleDataBanner />}
      <JsonLd
        data={datasetLd({
          name: "Vest payouts",
          description: "Every Vest payout PaidTape has recorded, with amount, chain, recipient wallet and transaction hash.",
          path: "/payouts",
          dateModified: summary.syncedAt ? new Date(summary.syncedAt).toISOString() : undefined,
        })}
      />
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Breadcrumbs items={[{ name: "Vest payouts", path: "/payouts" }]} />
        <h1 className="mt-5 text-3xl font-bold text-paper sm:text-4xl">Every Vest payout, with proof</h1>
        <p className="mt-3 max-w-3xl text-paper/75">
          This is the full list of Vest payouts PaidTape has recorded
          {summary.firstPaidAt ? ` since ${formatDate(summary.firstPaidAt)}` : ""}. On-chain payouts link to their
          transaction, so you can confirm each one on a block explorer. New payouts are added automatically.{" "}
          <Link href="/methodology" className="text-mint underline underline-offset-4">
            How we collect this data
          </Link>
          .
        </p>

        <StatGrid className="mt-8">
          <Stat label="All-time total" value={formatUsd(summary.windows.all.amount)} highlight />
          <Stat label="Payouts recorded" value={formatInt(summary.windows.all.count)} />
          <Stat label="Wallets paid" value={formatInt(summary.windows.all.wallets)} />
          <Stat label="Paid last 7 days" value={formatUsd(summary.windows["7d"].amount)} />
        </StatGrid>

        <div className="mt-10">
          <Suspense fallback={<PayoutTable payouts={initial.rows} caption="Latest Vest payouts" />}>
            <PayoutExplorer initial={initial} isSample={summary.isSample} />
          </Suspense>
        </div>

        <div className="mt-16">
          <ReferralPanel
            placement="feed"
            title="Want your own payout on this list?"
            body="Vest Instant Accounts start at $10 for $500 of capital with a 95% profit split, and evaluation accounts go up to $25,000. Claim profit any time; it arrives as USDC on Base or Arbitrum."
          />
        </div>
      </div>
    </>
  );
}
