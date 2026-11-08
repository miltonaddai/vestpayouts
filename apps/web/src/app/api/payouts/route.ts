import type { NextRequest } from "next/server";
import { CHAIN_IDS, type ChainId } from "@/lib/payouts/chains";
import { getLatestLive, queryPayouts } from "@/lib/payouts/repository";
import { PERIODS, type Period } from "@/lib/payouts/types";

const DAY = 86_400_000;

/** "YYYY-MM-DD" to the start of that UTC day, in ms. */
function parseDay(v: string | null): number | undefined {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const ms = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(ms) ? ms : undefined;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const chain = sp.get("chain");
  const period = sp.get("period");
  const min = Number(sp.get("min"));
  const max = Number(sp.get("max"));
  // Custom range: both days inclusive, so `to` becomes the start of the following day.
  let from = parseDay(sp.get("from"));
  let to = parseDay(sp.get("to"));
  if (to !== undefined) to += DAY;
  if (from !== undefined && to !== undefined && from >= to) [from, to] = [to - DAY, from + DAY];
  const custom = from !== undefined || to !== undefined;
  const sort = sp.get("sort") === "largest" ? "largest" : "latest";
  const live = sp.get("live") === "1";
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit")) || 10));
  try {
    if (live && sort === "latest" && (!period || period === "all") && !chain && !sp.get("min") && !sp.get("max") && !custom && !sp.get("q")) {
      const rows = await getLatestLive(limit);
      return Response.json(
        { rows, total: rows.length, sum: rows.reduce((s, p) => s + p.amount, 0), page: 1, pages: 1 },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const result = await queryPayouts({
      chain: CHAIN_IDS.includes(chain as ChainId) ? (chain as ChainId) : undefined,
      period: !custom && PERIODS.includes(period as Period) ? (period as Period) : "all",
      min: Number.isFinite(min) && min > 0 ? min : undefined,
      max: Number.isFinite(max) && max > 0 ? max : undefined,
      from,
      to,
      sort,
      q: sp.get("q")?.slice(0, 80) || undefined,
      page: Math.max(1, Number(sp.get("page")) || 1),
    });
    return Response.json(result, {
      headers: {
        "Cache-Control":
          sort === "latest" && (!period || period === "all") && !custom
            ? "public, max-age=0, s-maxage=10, stale-while-revalidate=30"
            : "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Payout data is temporarily unavailable." }, { status: 503 });
  }
}
