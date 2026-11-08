import { after, type NextRequest } from "next/server";
import { backendUrl } from "@/lib/backend";
import { requestCountry } from "@/lib/geo";
import { buildReferralUrl } from "@/lib/referral";

export const dynamic = "force-dynamic";

/**
 * Tracked referral redirect: /go?p=<placement>&from=<page>
 *
 * The 302 is decided here so every CTA stays on this origin. The click itself is
 * posted to the API, which holds the service-role key and writes referral_clicks.
 * CLICK_LOG_SECRET only authorizes that one insert.
 */
export async function GET(req: NextRequest) {
  const placement = (req.nextUrl.searchParams.get("p") || "unknown").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "unknown";
  const from = (req.nextUrl.searchParams.get("from") || "").slice(0, 200);
  const destination = buildReferralUrl({ placement, page: from });

  const click = {
    placement,
    from_path: from || null,
    referer: (req.headers.get("referer") ?? "").slice(0, 500) || null,
    user_agent: req.headers.get("user-agent")?.slice(0, 300) || null,
    country: requestCountry(req.headers),
  };

  after(async () => {
    console.log(JSON.stringify({ type: "referral_click", at: new Date().toISOString(), ...click }));
    const secret = process.env.CLICK_LOG_SECRET;
    if (!secret) return;
    await fetch(`${backendUrl()}/clicks`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify(click),
      signal: AbortSignal.timeout(3000),
    }).catch((err) => console.error("referral click post failed:", (err as Error).message));
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}
