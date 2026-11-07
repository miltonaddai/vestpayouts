import { ReferralButton, ReferralCodeHint } from "@/components/referral/referral-cta";
import type { Placement } from "@/lib/referral";

export function InlineCta({ placement = "blog-inline" }: { placement?: Placement }) {
  return (
    <aside className="not-prose my-10 flex flex-col gap-4 border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-heading text-lg font-medium text-ink">Ready to get funded on Vest?</p>
        <p className="mt-1 text-sm text-sub">Instant Accounts from $10. Claim profit any time, paid in USDC.</p>
        <ReferralCodeHint className="mt-2" />
      </div>
      <ReferralButton placement={placement} label="Open Vest" className="shrink-0" />
    </aside>
  );
}
