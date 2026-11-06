import type { Payout } from "./types";

export function payoutRoute(p: Pick<Payout, "source" | "chain" | "txHash" | "id">) {
  if (p.source === "onchain") return `/payouts/${p.chain}/${p.txHash}`;
  return `/payouts/${p.source}/${p.id}`;
}
