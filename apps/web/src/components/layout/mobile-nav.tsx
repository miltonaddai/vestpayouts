"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReferralLink } from "@/components/referral/referral-link";
import { SplitInner } from "@/components/ui/split-cta";
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
      <SheetContent side="right" className="w-80 border-line bg-background">
        <SheetHeader>
          <SheetTitle className="font-heading text-ink">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-4">
          <ul className="flex flex-col gap-1">
            {[{ href: "/", label: "Home" }, ...NAV, { href: "/methodology", label: "Methodology" }].map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-ink hover:bg-paper"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <ReferralLink placement="header" className="split-cta mt-6 w-full">
            <SplitInner>Start trading on Vest</SplitInner>
          </ReferralLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
