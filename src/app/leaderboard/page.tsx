import { LeaderboardView } from "@/components/payouts/leaderboard-view";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Vest Payout Leaderboard — Top Traders by USDC Received",
  description:
    "The Vest payout leaderboard: traders ranked by USDC received from Vest, all time and recent. Every total links to on-chain payout proof.",
  path: "/leaderboard",
  keywords: ["Vest payout leaderboard", "Vest top traders", "biggest Vest payouts"],
});

export default function LeaderboardPage() {
  return <LeaderboardView period="all" />;
}
