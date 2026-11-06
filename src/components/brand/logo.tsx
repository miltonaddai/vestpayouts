import { cn } from "@/lib/utils";

/** PaidTape mark: a strip of ticker tape that folds into a check. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="#0d1112" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#263135" />
      <path
        d="M7 16.5l5.2 5.2L25 9"
        fill="none"
        stroke="#3ee0a1"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#0d1112">
        <circle cx="15.4" cy="18.4" r="0.95" />
        <circle cx="18.6" cy="15.2" r="0.95" />
        <circle cx="21.8" cy="12" r="0.95" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight text-paper">
        Paid<span className="text-mint">Tape</span>
      </span>
    </span>
  );
}
