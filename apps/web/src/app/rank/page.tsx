import { Suspense } from "react";
import { VestHeroHeading } from "@/components/brand/vest-hero-icon";
import { RankExtras } from "@/components/rank/rank-extras";
import { RankLookup } from "@/components/rank/rank-lookup";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { getLeaderboard, getSummary } from "@/lib/payouts/repository";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "See Your Rank — Vest Payout Leaderboard Wallet Lookup",
  description:
    "Look up any wallet's all-time rank on the Vest payout leaderboard, then download a rank card with your name and X handle to share.",
  path: "/rank",
  keywords: ["Vest payout rank", "Vest leaderboard wallet lookup", "Vest payout card"],
});

export default async function RankPage() {
  const [board, summary] = await Promise.all([getLeaderboard("all", 500), getSummary()]);
  const extras = <RankExtras board={board} wallets={summary.windows.all.wallets} />;
  return (
    <div className="px-6 pt-8 pb-16 md:px-14">
      <Breadcrumbs items={[{ name: "See your rank", path: "/rank" }]} />
      <p className="meta mt-6">§ 00 — Your rank</p>
      <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">
        Where does your <VestHeroHeading>Vest</VestHeroHeading> wallet rank?
      </h1>
      <p className="mt-4 mb-8 max-w-2xl text-[16px] leading-[1.6] text-sub">
        Paste your payout wallet to get your rank card.
      </p>
      <Suspense fallback={extras}>
        <RankLookup empty={extras} />
      </Suspense>
    </div>
  );
}
