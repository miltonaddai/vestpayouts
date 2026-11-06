export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  keywords: string[];
  readingMinutes: number;
}

export const POST_META: PostMeta[] = [
  {
    slug: "how-to-get-paid-on-vest",
    title: "How to Get Paid on Vest: Claim Profit and Withdraw USDC (2026 Guide)",
    description:
      "Step-by-step: how to claim profit from a Vest funded account, withdraw USDC to Base or Arbitrum, how long each step takes, limits, and mistakes to avoid.",
    published: "2026-11-05",
    updated: "2026-11-05",
    keywords: ["how to get paid on Vest", "Vest withdrawal", "Vest claim profit", "Vest payout time"],
    readingMinutes: 7,
  },
  {
    slug: "vest-payout-proof",
    title: "Vest Payout Proof: How to Verify Any Vest Payout On-Chain",
    description:
      "Don't trust screenshots. Learn how to verify Vest payout proof on BaseScan and Arbiscan, which contracts Vest pays from, and how to spot fake payout claims.",
    published: "2026-11-05",
    updated: "2026-11-05",
    keywords: ["Vest payout proof", "is Vest legit", "Vest payouts verified", "Vest Markets proof of payout"],
    readingMinutes: 6,
  },
  {
    slug: "vest-vs-competitors",
    title: "Vest vs Other Prop Firms: Payouts, Profit Split and Rules Compared",
    description:
      "How Vest Capital compares with typical futures, forex and crypto prop firms on payout speed, payout rails, profit split, drawdown rules and pricing.",
    published: "2026-11-05",
    updated: "2026-11-05",
    keywords: ["Vest vs competitors", "Vest vs prop firms", "best crypto prop firm payouts", "Vest alternative"],
    readingMinutes: 8,
  },
  {
    slug: "vest-instant-vs-evaluation",
    title: "Vest Instant Account vs Evaluation: Which Gets You Paid Faster?",
    description:
      "Vest Instant Accounts pay a 95% split with no evaluation; evaluation accounts cost less per dollar of capital. Here's how the maths and the rules compare.",
    published: "2026-11-05",
    updated: "2026-11-05",
    keywords: ["Vest instant account", "Vest evaluation", "Vest Capital pricing", "Vest profit split"],
    readingMinutes: 6,
  },
];

export const getPostMeta = (slug: string) => POST_META.find((p) => p.slug === slug) ?? null;
