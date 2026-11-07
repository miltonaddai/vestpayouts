import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NAV } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 min-w-0 border-b border-line bg-background/95 font-mono text-[12px] backdrop-blur">
      <div className="border-b border-line bg-orange-soft">
        <p className="flex flex-wrap items-center justify-center gap-x-2 px-4 py-2 text-center text-[11px] leading-5 tracking-[0.02em] text-sub sm:px-6">
          <span className="font-semibold text-orange">Independent tracker.</span>
          <span>Not affiliated with or endorsed by Vest.</span>
          <Link href="/about" className="underline underline-offset-2 hover:text-ink">
            About VestPayouts
          </Link>
        </p>
      </div>
      <div className="flex min-w-0 flex-wrap items-stretch">
        <Link
          href="/"
          aria-label="VestPayouts home"
          className="order-1 flex shrink-0 items-center px-5 py-3.5 lg:border-r lg:border-line lg:px-6"
        >
          <Logo />
        </Link>
        <div className="order-3 flex w-full min-w-0 border-t border-line lg:order-2 lg:w-auto lg:flex-1 lg:border-t-0">
          <nav id="nav-scroll" aria-label="Main" className="nav-scroll flex min-w-0 flex-1 overflow-x-auto lg:overflow-x-visible">
            {NAV.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                className="border-r border-line px-4 py-3 whitespace-nowrap text-sub uppercase hover:text-ink lg:px-5 lg:py-4"
              >
                <span className="hidden lg:inline">[ {String(i).padStart(2, "0")} ] </span>
                {n.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
        <div className="order-2 ml-auto flex items-center justify-end border-line px-4 py-3.5 text-[11px] lg:order-3 lg:ml-0 lg:border-l lg:px-6 lg:text-[12px]">
          <span className="text-green" aria-hidden="true">
            ●
          </span>
          <span className="ml-2 font-bold tracking-[0.04em] text-green uppercase"><span className="sm:hidden">Live</span><span className="hidden sm:inline">Tracking payouts</span></span>
        </div>
      </div>
    </header>
  );
}
