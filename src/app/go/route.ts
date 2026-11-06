import { after, type NextRequest } from "next/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/clients";
import { buildReferralUrl } from "@/lib/referral";

export const dynamic = "force-dynamic";

/**
 * Tracked referral redirect: /go?p=<placement>&from=<page>
 * Writes a row to public.referral_clicks (service role; the table has no public policies),
 * logs a structured line, and optionally POSTs REFERRAL_WEBHOOK_URL.
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
    country: req.headers.get("x-vercel-ip-country") || null,
  };

  after(async () => {
    console.log(JSON.stringify({ type: "referral_click", at: new Date().toISOString(), ...click }));
    if (isServiceRoleConfigured) {
      const { error } = await getServiceClient().from("referral_clicks").insert(click);
      if (error) console.error("referral click insert failed:", error.message);
    }
    const hook = process.env.REFERRAL_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "referral_click", at: new Date().toISOString(), ...click }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
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
