import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { REFERRAL_CODE, type Placement } from "@/lib/referral";
import { cn } from "@/lib/utils";
import { ReferralLink } from "./referral-link";

export function ReferralButton({
  placement,
  label = "Start trading on Vest",
  size = "xl",
  variant = "default",
  className,
}: {
  placement: Placement;
  label?: string;
  size?: "default" | "lg" | "xl" | "sm";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  return (
    <ReferralLink
      placement={placement}
      className={cn(
        buttonVariants({ size, variant }),
        variant === "default" && "shadow-[0_0_0_1px_rgba(62,224,161,0.3),0_8px_30px_-8px_rgba(62,224,161,0.55)]",
        className,
      )}
    >
      {label}
      <ArrowUpRight aria-hidden="true" />
    </ReferralLink>
  );
}

export function ReferralCodeHint({ className }: { className?: string }) {
  if (!REFERRAL_CODE) return null;
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Use referral code{" "}
      <code className="rounded-md bg-ink-800 px-1.5 py-0.5 font-mono text-mint-300">{REFERRAL_CODE}</code> at signup.
    </p>
  );
}

/** Full-width conversion block used at the end of most pages. */
export function ReferralPanel({
  placement,
  title = "Get funded on Vest and get paid in USDC",
  body = "Pick an Instant Account from $10 or take the evaluation path, trade crypto, stocks and commodities 24/7, and claim profit whenever you're up. Payouts land in your wallet as USDC on Base or Arbitrum.",
  className,
}: {
  placement: Placement;
  title?: string;
  body?: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`cta-${placement}`}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-mint/25 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-8 sm:p-10",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-mint/15 blur-3xl"
      />
      <div className="relative max-w-2xl">
        <h2 id={`cta-${placement}`} className="text-2xl font-semibold text-paper sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-paper/75">{body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ReferralButton placement={placement} />
          <ReferralCodeHint />
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Referral link: we may earn a commission if you sign up. Trading involves substantial risk of loss.
        </p>
      </div>
    </section>
  );
}
