"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { trackReferralClick } from "@/lib/analytics";
import { referralHref, type Placement } from "@/lib/referral";

type Props = Omit<ComponentProps<"a">, "href"> & { placement: Placement };

/** Every outbound Vest link goes through /go so clicks are counted server-side too. */
export function ReferralLink({ placement, onClick, children, ...rest }: Props) {
  const pathname = usePathname();
  return (
    <a
      href={referralHref(placement, pathname)}
      target="_blank"
      rel="sponsored nofollow noopener"
      data-placement={placement}
      onClick={(e) => {
        trackReferralClick(placement);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
