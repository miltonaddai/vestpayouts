/**
 * Single source of truth for the owner's Vest referral.
 *
 * NEXT_PUBLIC_VEST_REFERRAL_URL   full referral link from your Vest dashboard (preferred)
 * NEXT_PUBLIC_VEST_REFERRAL_CODE  code shown next to CTAs; also appended as ?<param>=<code>
 *                                 when no full URL is set
 * NEXT_PUBLIC_VEST_REFERRAL_PARAM query param name used with the code (default "ref")
 * NEXT_PUBLIC_REFERRAL_APPEND_UTM set to "false" if UTM params interfere with Vest's tracking
 */
const FALLBACK_URL = "https://www.vestmarkets.com/";

export const REFERRAL_CODE = (process.env.NEXT_PUBLIC_VEST_REFERRAL_CODE || "").trim();
const REFERRAL_URL = (process.env.NEXT_PUBLIC_VEST_REFERRAL_URL || "").trim();
const REFERRAL_PARAM = (process.env.NEXT_PUBLIC_VEST_REFERRAL_PARAM || "ref").trim();
const APPEND_UTM = process.env.NEXT_PUBLIC_REFERRAL_APPEND_UTM !== "false";

export const REFERRAL_CONFIGURED = Boolean(REFERRAL_URL || REFERRAL_CODE);

export type Placement =
  | "header"
  | "hero"
  | "hero-secondary"
  | "inline-logo"
  | "feed"
  | "stats"
  | "sticky-mobile"
  | "payout-detail"
  | "wallet"
  | "leaderboard"
  | "guide"
  | "review"
  | "faq"
  | "blog"
  | "blog-inline"
  | "footer"
  | "compare";

export function referralBaseUrl(): URL {
  const url = new URL(REFERRAL_URL || FALLBACK_URL);
  if (!REFERRAL_URL && REFERRAL_CODE) url.searchParams.set(REFERRAL_PARAM, REFERRAL_CODE);
  return url;
}

export function buildReferralUrl(opts: { placement: string; page?: string }) {
  const url = referralBaseUrl();
  if (APPEND_UTM) {
    url.searchParams.set("utm_source", "vestpayouts");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", opts.placement);
    if (opts.page) url.searchParams.set("utm_content", opts.page.slice(0, 100));
  }
  return url.toString();
}

/** Internal tracked redirect used by every CTA: /go?p=<placement>&from=<path>. */
export function referralHref(placement: Placement, from?: string) {
  const params = new URLSearchParams({ p: placement });
  if (from) params.set("from", from);
  return `/go?${params.toString()}`;
}
