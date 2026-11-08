"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ReferralLink } from "@/components/referral/referral-link";
import { SplitInner } from "@/components/ui/split-cta";
import { NAV } from "@/lib/site";

const MENU_LINKS = [{ href: "/", label: "Home" }, ...NAV] as const;

export function MobileNav() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  // Close on navigation. Clearing `open` on the element fires its toggle event,
  // and onToggle below syncs the state.
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (detailsRef.current) detailsRef.current.open = false;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
    setOpen(false);
  }

  return (
    <details
      ref={detailsRef}
      className="group/nav lg:hidden"
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary
        className="flex h-full min-h-11 min-w-11 cursor-pointer list-none items-center justify-center border-l border-line px-3 text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal [&::-webkit-details-marker]:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span
            className="absolute top-0 left-0 h-0.5 w-5 bg-current transition duration-200 ease-out group-open/nav:top-[7px] group-open/nav:rotate-45 motion-reduce:transition-none"
          />
          <span
            className="absolute top-[7px] left-0 h-0.5 w-5 bg-current transition duration-200 ease-out group-open/nav:opacity-0 motion-reduce:transition-none"
          />
          <span
            className="absolute top-[14px] left-0 h-0.5 w-5 bg-current transition duration-200 ease-out group-open/nav:top-[7px] group-open/nav:-rotate-45 motion-reduce:transition-none"
          />
        </span>
      </summary>
      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute top-full left-0 z-40 h-[calc(100dvh-100%)] w-full overflow-y-auto overflow-x-hidden border-t border-line bg-background"
      >
        <nav aria-label="Mobile">
          <ul>
            {MENU_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex min-h-11 items-center border-b border-line px-5 font-mono text-[13px] tracking-[0.04em] text-sub uppercase hover:bg-paper hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle className="w-full justify-between border-l-0 border-b border-line px-5 py-3.5" />
        <div className="p-5">
          <ReferralLink placement="header" className="split-cta w-full">
            <SplitInner>Get funded on Vest</SplitInner>
          </ReferralLink>
        </div>
      </div>
    </details>
  );
}
