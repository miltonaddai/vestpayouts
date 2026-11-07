import { cn } from "@/lib/utils";

/** Receipt mark: a payout record, not Vest's logo and not a menu icon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" fill="#ffffff" />
      <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="#d9dadd" />
      <path
        d="M10 7.5h8.2L23.5 13V24.5a1.5 1.5 0 0 1-1.5 1.5H10a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 10 7.5z"
        fill="none"
        stroke="#0e1012"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
      <path d="M18.2 7.5V13H23.5" fill="none" stroke="#0e1012" strokeWidth="1.6" strokeLinejoin="miter" />
      <rect x="11.2" y="16.2" width="9.2" height="2" fill="#2f4cff" />
      <rect x="11.2" y="20.2" width="6" height="2" fill="#2f4cff" opacity="0.45" />
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
