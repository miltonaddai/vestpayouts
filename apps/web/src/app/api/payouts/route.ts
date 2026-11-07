import type { NextRequest } from "next/server";
import { CHAIN_IDS, type ChainId } from "@/lib/payouts/chains";
import { queryPayouts } from "@/lib/payouts/repository";
import { PERIODS, type Period } from "@/lib/payouts/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const chain = sp.get("chain");
  const period = sp.get("period");
  const min = Number(sp.get("min"));
  try {
    const result = await queryPayouts({
      chain: CHAIN_IDS.includes(chain as ChainId) ? (chain as ChainId) : undefined,
      period: PERIODS.includes(period as Period) ? (period as Period) : "all",
      min: Number.isFinite(min) && min > 0 ? min : undefined,
      sort: sp.get("sort") === "largest" ? "largest" : "latest",
      q: sp.get("q")?.slice(0, 80) || undefined,
      page: Math.max(1, Number(sp.get("page")) || 1),
    });
    return Response.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Payout data is temporarily unavailable." }, { status: 503 });
  }
}
