import { ReferralLink } from "./referral-link";
import { SplitInner } from "@/components/ui/split-cta";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 p-3 backdrop-blur sm:hidden">
      <ReferralLink placement="sticky-mobile" className="split-cta w-full">
        <SplitInner>Get funded on Vest — from $10</SplitInner>
      </ReferralLink>
    </div>
  );
}
