import Link from "next/link";
import { SplitCta } from "@/components/ui/split-cta";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center md:px-14">
      <p className="font-mono text-sm text-signal">404</p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-ink">That page isn&apos;t here</h1>
      <p className="mt-3 text-sub">The payout may not be in the database yet, or the address was typed wrong.</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <SplitCta href="/">Home</SplitCta>
        <Link href="/payouts" className="border border-line px-5 py-3 font-mono text-[12px] tracking-[0.04em] text-ink uppercase hover:bg-paper">
          All payouts
        </Link>
      </div>
    </div>
  );
}
