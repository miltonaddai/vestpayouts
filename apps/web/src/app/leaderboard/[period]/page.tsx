import { notFound } from "next/navigation";
import { LeaderboardView } from "@/components/payouts/leaderboard-view";
import { PERIOD_LABEL, type Period } from "@/lib/payouts/types";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const PERIODS = ["24h", "7d", "30d"] as const;

export function generateStaticParams() {
  return PERIODS.map((period) => ({ period }));
}

export async function generateMetadata({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!PERIODS.includes(period as (typeof PERIODS)[number])) return {};
  const label = PERIOD_LABEL[period as Period];
  return pageMetadata({
    title: `Vest Payout Leaderboard — ${label}`,
    description: `Traders ranked by Vest payouts received in the ${label.toLowerCase()}. Totals come from on-chain USDC transfers.`,
    path: `/leaderboard/${period}`,
  });
}

export default async function LeaderboardPeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!PERIODS.includes(period as (typeof PERIODS)[number])) notFound();
  return <LeaderboardView period={period as Period} />;
}
