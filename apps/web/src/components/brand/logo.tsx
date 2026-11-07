import { cn } from "@/lib/utils";
import { VEST_BLOCK_PATH } from "@/components/brand/vest-block";

/** VEST letter-block mark: 2x2 VE/ST on a solid square that inverts with the theme. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 text-ink", className)}>
      <rect width="32" height="32" fill="currentColor" />
      <path className="fill-background" d={VEST_BLOCK_PATH} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-[15px] font-medium tracking-[-0.02em] text-ink sm:text-[17px]">
        VestPayouts
      </span>
    </span>
  );
}
