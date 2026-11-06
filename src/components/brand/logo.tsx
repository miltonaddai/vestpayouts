import { cn } from "@/lib/utils";

/** Receipt mark: a payout record, not Vest's logo and not a menu icon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="#0d1112" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#263135" />
      <path
        d="M10 7.5h8.2L23.5 13V24.5a1.5 1.5 0 0 1-1.5 1.5H10a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 10 7.5z"
        fill="none"
        stroke="#94a3a0"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M18.2 7.5V13H23.5" fill="none" stroke="#94a3a0" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="11.2" y="16.2" width="9.2" height="2" rx="1" fill="#3ee0a1" />
      <rect x="11.2" y="20.2" width="6" height="2" rx="1" fill="#3ee0a1" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-[15px] font-semibold tracking-tight text-paper sm:text-lg">
        Vest<span className="text-mint">Payouts</span>
      </span>
    </span>
  );
}
