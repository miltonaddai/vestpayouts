import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Tight crop of the official Vest V-mark (header / favicon paths from vestmarkets.com). */
const VIEWBOX = "0.72 0.83 547.22 338";

/**
 * Official Vest V-mark, sized to the surrounding headline's cap-height.
 * Pair with adjacent text via VestHeroHeading so it sits on the baseline.
 */
export function VestHeroIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox={VIEWBOX}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
      className={cn("block h-[1cap] w-auto shrink-0 text-current", className)}
    >
      <path
        fill="currentColor"
        d="M546.559 104.307L418.198 1.6418C415.785 -0.290179 412.222 1.43159 412.222 4.52475V217.483L546.559 110.043C548.401 108.561 548.401 105.768 546.559 104.307Z"
      />
      <path
        fill="currentColor"
        d="M130.463 1.64132L2.10114 104.296C0.259255 105.778 0.259255 108.571 2.10114 110.032L136.429 217.472V4.52427C136.429 1.43111 132.865 -0.260628 130.453 1.64132H130.463Z"
      />
      <path
        fill="currentColor"
        d="M272.038 325.934L136.429 217.482V335.143C136.429 337.165 138.06 338.827 140.112 338.827H408.597C410.62 338.827 412.281 337.195 412.281 335.143V217.482L276.672 325.934C275.331 327.005 273.439 327.005 272.068 325.934H272.038Z"
      />
    </svg>
  );
}

/** V-mark + headline text, cap-aligned: icon sits on the baseline and matches the cap height of nearby letters. */
export function VestHeroHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.16em]", className)}>
      <VestHeroIcon />
      {children}
    </span>
  );
}
