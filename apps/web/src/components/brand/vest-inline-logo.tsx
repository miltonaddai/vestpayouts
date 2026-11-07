"use client";

import { ReferralLink } from "@/components/referral/referral-link";
import type { Placement } from "@/lib/referral";
import { cn } from "@/lib/utils";

/** Vest's official header wordmark, inlined at text cap-height and linked through /go. */
export function VestInlineLogo({
  placement,
  className,
}: {
  placement: Placement;
  className?: string;
}) {
  return (
    <ReferralLink
      placement={placement}
      className={cn("mx-0.5 inline-flex items-baseline no-underline", className)}
      title="Vest (vestmarkets.com)"
    >
      <img
        src="/brands/vest-logo.svg"
        alt="Vest"
        className="inline h-[1cap] w-auto align-baseline dark:hidden"
      />
      <img
        src="/brands/vest-logo-dark.svg"
        alt="Vest"
        className="hidden h-[1cap] w-auto align-baseline dark:inline"
      />
    </ReferralLink>
  );
}
