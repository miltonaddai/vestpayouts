"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav id="nav-scroll" aria-label="Main" className="flex min-w-0 flex-1 items-stretch">
      {NAV.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className="header-nav-link flex h-full items-center justify-center border-r border-line px-4 py-3 leading-none whitespace-nowrap uppercase lg:px-5 lg:py-4"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
