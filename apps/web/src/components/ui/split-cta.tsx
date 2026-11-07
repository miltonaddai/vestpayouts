import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SplitInner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="split-cta-arrow" aria-hidden="true">
        →
      </span>
      <span className="split-cta-label">{children}</span>
    </>
  );
}

export function SplitCta({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("split-cta", className)}>
      <SplitInner>{children}</SplitInner>
    </Link>
  );
}
