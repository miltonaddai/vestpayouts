"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReferralLink } from "@/components/referral/referral-link";
import { NAV } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 border-ink-800 bg-ink-950">
        <SheetHeader>
          <SheetTitle className="font-heading text-paper">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-4">
          <ul className="flex flex-col gap-1">
            {[{ href: "/", label: "Home" }, ...NAV, { href: "/methodology", label: "Methodology" }].map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-paper/85 hover:bg-ink-800"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <ReferralLink
            placement="header"
            className="mt-6 flex h-12 items-center justify-center rounded-xl bg-mint font-semibold text-ink-950"
          >
            Start trading on Vest
          </ReferralLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
