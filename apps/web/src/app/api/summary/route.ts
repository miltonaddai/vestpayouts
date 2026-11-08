import { getSummaryLive } from "@/lib/payouts/repository";

export const dynamic = "force-dynamic";

/**
 * Live totals for the home page counters. The CDN keeps each response for ~10s,
 * so however many visitors are polling, Supabase sees about one read per 10s.
 */
export async function GET() {
  try {
    const summary = await getSummaryLive();
    return Response.json(summary, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=20" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Totals are temporarily unavailable." }, { status: 503 });
  }
}
