import { cn } from "@/lib/utils";
import {
  VEST_WORDMARK_HEIGHT,
  VEST_WORDMARK_PATH,
  VEST_WORDMARK_WIDTH,
} from "@/components/brand/vest-block";

/** Rectangular VEST wordmark: one-line letters on a solid block that inverts with the theme. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VEST_WORDMARK_WIDTH} ${VEST_WORDMARK_HEIGHT}`}
      aria-hidden="true"
      className={cn("h-8 w-auto text-ink", className)}
    >
      <rect width={VEST_WORDMARK_WIDTH} height={VEST_WORDMARK_HEIGHT} fill="currentColor" />
      <path className="fill-background" d={VEST_WORDMARK_PATH} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span
        className="font-heading text-[15px] font-medium tracking-[-0.02em] text-ink sm:text-[17px]"
        aria-hidden="true"
      >
        Payouts
      </span>
      <span className="sr-only">VestPayouts</span>
    </span>
  );
}
