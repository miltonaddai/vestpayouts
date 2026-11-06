import { ReferralButton, ReferralCodeHint } from "@/components/referral/referral-cta";
import type { Placement } from "@/lib/referral";

export function InlineCta({ placement = "blog-inline" }: { placement?: Placement }) {
  return (
    <aside className="not-prose my-10 flex flex-col gap-4 rounded-2xl border border-ink-700 bg-ink-850 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-heading text-lg font-semibold text-paper">Ready to get funded on Vest?</p>
        <p className="mt-1 text-sm text-paper/70">Instant Accounts from $10. Claim profit any time, paid in USDC.</p>
        <ReferralCodeHint className="mt-2" />
      </div>
      <ReferralButton placement={placement} label="Open Vest" size="lg" className="h-11 shrink-0 px-5" />
    </aside>
  );
}
