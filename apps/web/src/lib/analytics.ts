"use client";

type Props = Record<string, string | number | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Props }) => void;
    posthog?: { capture: (event: string, props?: Props) => void };
  }
}

/**
 * Client-side click hook for referral CTAs. Forwards to whichever analytics tool is
 * installed (GTM/GA4, Plausible, PostHog) and emits a DOM event for custom listeners:
 *   window.addEventListener("vestpayouts:referral-click", (e) => console.log(e.detail))
 * The /go redirect also logs every click server-side, so this is best-effort only.
 */
export function trackReferralClick(placement: string, extra: Props = {}) {
  if (typeof window === "undefined") return;
  const props: Props = { placement, page: window.location.pathname, ...extra };
  try {
    window.dataLayer?.push({ event: "referral_click", ...props });
    window.gtag?.("event", "referral_click", props);
    window.plausible?.("Referral Click", { props });
    window.posthog?.capture("referral_click", props);
    window.dispatchEvent(new CustomEvent("vestpayouts:referral-click", { detail: props }));
  } catch {
    // analytics must never block navigation
  }
}
