import Link from "next/link";
import { Suspense } from "react";
import { VestHeroHeading } from "@/components/brand/vest-hero-icon";
import { RankLookup } from "@/components/rank/rank-lookup";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "See Your Rank — Vest Payout Leaderboard Wallet Lookup",
  description:
    "Look up any wallet's all-time rank on the Vest payout leaderboard, then download a rank card with your name and X handle to share.",
  path: "/rank",
  keywords: ["Vest payout rank", "Vest leaderboard wallet lookup", "Vest payout card"],
});

export default function RankPage() {
  return (
    <div className="px-6 pt-8 pb-16 md:px-14">
      <Breadcrumbs items={[{ name: "See your rank", path: "/rank" }]} />
      <p className="meta mt-6">§ 00 — Your rank</p>
      <h1 className="mt-3 max-w-full text-[clamp(1.75rem,8vw,2.25rem)] leading-[0.96] font-medium tracking-[-0.035em] text-ink md:text-[56px]">
        Where does your <VestHeroHeading>Vest</VestHeroHeading> wallet rank?
      </h1>
      <p className="mt-4 mb-8 max-w-2xl text-[16px] leading-[1.6] text-sub">
        Paste the wallet that receives your Vest payouts to see its all-time rank by total USDC received, out of every wallet Vest has paid. Add a
        name and handle, then download your card. Ranks use the same data as the{" "}
        <Link href="/leaderboard" className="text-ink underline decoration-line underline-offset-4 hover:decoration-signal">
          leaderboard
        </Link>
        .
      </p>
      <Suspense>
        <RankLookup />
      </Suspense>
    </div>
  );
}
