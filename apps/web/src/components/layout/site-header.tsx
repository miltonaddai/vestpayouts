import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ReferralButton } from "@/components/referral/referral-cta";
import { NAV } from "@/lib/site";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/90 backdrop-blur-md">
      <div className="border-b border-amber/30 bg-amber/10">
        <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 px-4 py-1.5 text-center text-xs leading-5 text-paper/90 sm:px-6">
          <span className="font-semibold text-amber">Independent tracker.</span>
          <span>Not affiliated with or endorsed by Vest.</span>
          <Link href="/about" className="underline underline-offset-2 hover:text-paper">
            About VestPayouts
          </Link>
        </p>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="VestPayouts home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-paper/75 transition-colors hover:bg-ink-800 hover:text-paper"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ReferralButton placement="header" label="Join Vest" size="lg" className="hidden px-4 sm:inline-flex" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
