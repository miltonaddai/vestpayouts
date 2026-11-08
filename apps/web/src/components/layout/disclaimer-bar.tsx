"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 10_000;

/**
 * "Independent tracker" notice. Shown on every full page load, then collapses
 * after 10s. The header persists across client navigation, so it stays hidden
 * until the next reload. Server HTML always includes it.
 */
export function DisclaimerBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHidden(true), VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none",
        hidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="border-b border-line bg-orange-soft">
          <p className="flex flex-wrap items-center justify-center gap-x-2 px-4 py-2 text-center text-[12px] leading-5 tracking-[0.02em] text-sub sm:px-6">
            <span className="font-semibold text-orange">Independent tracker.</span>
            <span>Not affiliated with or endorsed by Vest.</span>
            <Link href="/about" className="underline underline-offset-2 hover:text-ink">
              About VestPayouts
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
