import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PaidTape — Vest payouts tracked on-chain";

export default function Image() {
  return ogCard({
    eyebrow: "Vest payout tracker",
    title: "Every Vest payout, straight off the chain.",
    footer: "Base · Arbitrum · Independent",
  });
}
