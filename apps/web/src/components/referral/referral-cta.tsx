import { buttonVariants } from "@/components/ui/button";
import { SplitInner } from "@/components/ui/split-cta";
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
  if (variant === "default") {
    return (
      <ReferralLink placement={placement} className={cn("split-cta", className)}>
        <SplitInner>{label}</SplitInner>
      </ReferralLink>
    );
  }
  return (
    <ReferralLink placement={placement} className={cn(buttonVariants({ size, variant }), className)}>
      {label}
    </ReferralLink>
  );
}

export function ReferralCodeHint({ className }: { className?: string }) {
  if (!REFERRAL_CODE) return null;
  return (
    <p className={cn("text-sm text-sub", className)}>
      Use referral code{" "}
      <code className="bg-paper px-1.5 py-0.5 font-mono text-ink">{REFERRAL_CODE}</code> at signup.
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
    <section aria-labelledby={`cta-${placement}`} className={cn("border border-line", className)}>
      <div className="border-b border-line bg-paper px-5 py-2.5 font-mono text-[12px] tracking-[0.04em] text-sub uppercase">
        Referral · Instant accounts from $10
      </div>
      <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_auto] md:items-end md:px-8 md:py-10">
        <div>
          <h2 id={`cta-${placement}`} className="text-[28px] leading-[1.1] font-medium tracking-[-0.03em] text-ink sm:text-[36px]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.6] text-sub">{body}</p>
          <ReferralCodeHint className="mt-3" />
          <p className="mt-4 text-[12px] text-sub">
            Referral link: we may earn a commission if you sign up. Trading involves substantial risk of loss.
          </p>
        </div>
        <ReferralButton placement={placement} />
      </div>
    </section>
  );
}
