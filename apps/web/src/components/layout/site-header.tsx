import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DisclaimerBar } from "@/components/layout/disclaimer-bar";
import { HeaderNav } from "@/components/layout/header-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 min-w-0 border-b border-line bg-background/95 font-mono text-[12px] backdrop-blur">
      <DisclaimerBar />
      <div className="flex min-w-0 items-stretch">
        <Link
          href="/"
          aria-label="VestPayouts home"
          className="flex shrink-0 items-center px-4 py-3.5 xl:border-r xl:border-line xl:px-6"
        >
          <Logo />
        </Link>
        <div className="hidden min-w-0 xl:flex xl:flex-1">
          <HeaderNav />
          <ThemeToggle />
        </div>
        <div className="ml-auto flex items-center justify-end px-3 py-3.5 text-[11px] xl:ml-0 xl:border-l xl:border-line xl:px-6 xl:text-[12px]">
          <span className="text-green" aria-hidden="true">
            ●
          </span>
          <span className="ml-2 font-bold tracking-[0.04em] text-green uppercase">
            <span className="sm:hidden">Live</span>
            <span className="hidden sm:inline">Tracking payouts</span>
          </span>
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
