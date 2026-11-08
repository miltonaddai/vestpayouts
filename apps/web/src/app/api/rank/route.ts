import { getSummary, getWallet, getWalletRank } from "@/lib/payouts/repository";

export const dynamic = "force-dynamic";

export interface RankResponse {
  wallet: string;
  label: string | null;
  xHandle: string | null;
  rank: number | null;
  wallets: number;
  total: number;
  count: number;
  largest: number;
  firstPaidAt: number;
  lastPaidAt: number;
  /** When this rank was computed (ms), shown on the card. */
  asOf: number;
}

/** GET /api/rank?wallet=0x…  All-time rank and totals for one wallet. */
export async function GET(req: Request) {
  const wallet = new URL(req.url).searchParams.get("wallet")?.trim().toLowerCase() ?? "";
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    return Response.json({ error: "Enter a full 0x wallet address (42 characters)." }, { status: 400 });
  }
  try {
    const [profile, rank, summary] = await Promise.all([getWallet(wallet), getWalletRank(wallet), getSummary()]);
    if (!profile) {
      return Response.json({ error: "No Vest payouts found for this wallet yet." }, { status: 404 });
    }
    const times = profile.payouts.map((p) => p.paidAt);
    const body: RankResponse = {
      wallet,
      label: profile.label,
      xHandle: profile.xHandle,
      rank: rank.rank,
      wallets: rank.wallets ?? summary.windows.all.wallets,
      total: profile.amount,
      count: profile.count,
      largest: profile.largest?.amount ?? 0,
      firstPaidAt: Math.min(...times),
      lastPaidAt: Math.max(...times),
      asOf: Date.now(),
    };
    return Response.json(body, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Ranks are temporarily unavailable. Try again in a moment." }, { status: 503 });
  }
}
