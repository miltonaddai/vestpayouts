import { ReferralLink } from "./referral-link";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-800 bg-ink-950/95 p-3 backdrop-blur sm:hidden">
      <ReferralLink
        placement="sticky-mobile"
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-mint text-base font-semibold text-ink-950"
      >
        Get funded on Vest — from $10
      </ReferralLink>
    </div>
  );
}
