import { formatDate, formatUsd } from "@/lib/format";
import { CHAINS } from "@/lib/payouts/chains";
import { getPayoutsAtRoute } from "@/lib/payouts/repository";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Vest payout proof";
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ network: string; ref: string }> }) {
  const { network, ref } = await params;
  const rows = await getPayoutsAtRoute(network, ref);
  if (!rows) return ogCard({ eyebrow: "Vest payout", title: "Payout not found" });
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const p = rows[0];
  return ogCard({
    eyebrow: p.source === "sample" ? "Sample data" : "Vest payout proof",
    value: formatUsd(total, true),
    title: `Paid in USDC${p.chain ? ` on ${CHAINS[p.chain].name}` : ""} · ${formatDate(p.paidAt)}`,
    footer: p.txHash ? `tx ${p.txHash.slice(0, 18)}…` : undefined,
  });
}
