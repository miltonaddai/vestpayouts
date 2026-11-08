export const SITE = {
  name: "VestPayouts",
  tagline: "Every Vest payout, straight off the chain.",
  description:
    "VestPayouts tracks Vest payouts in real time: every USDC payout Vest sends to traders on Base and Arbitrum, with on-chain proof, totals, a leaderboard and plain-English guides. Independent, and not affiliated with Vest.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://vestpayouts.com").replace(/\/$/, ""),
  locale: "en_US",
  twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@vestpayouts.com",
  founded: "2026",
} as const;

export const NAV = [
  { href: "/payouts", label: "Payouts" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rank", label: "See your rank" },
  { href: "/how-vest-payouts-work", label: "How payouts work" },
  { href: "/vest-review", label: "Vest review" },
  { href: "/blog", label: "Guides" },
  { href: "/faq", label: "FAQ" },
] as const;

export const NOT_AFFILIATED =
  "VestPayouts is an independent tracker. It is not affiliated with, endorsed by, or operated by Vest, Vest Markets, Vest Labs or Vest Exchange. “Vest” is used only to describe the platform whose public payout data we track.";

export const AFFILIATE_DISCLOSURE =
  "Some links on this site are referral links. If you sign up to Vest through them, we may earn a commission at no extra cost to you. It never changes the payout data we show.";

export const RISK_WARNING =
  "Trading leveraged derivatives carries a high risk of loss. Most evaluation and funded-account fees are lost. Past payouts to other traders don't predict yours. Nothing here is financial advice.";

export function absoluteUrl(path = "/") {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
