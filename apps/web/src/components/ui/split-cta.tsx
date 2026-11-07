import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Glyph used by split buttons and text arrow links. Translates on `.arrow-cta` / `.split-cta` hover. */
export function ArrowIcon({
  children = "→",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("arrow-cta-icon", className)} aria-hidden="true">
      {children}
    </span>
  );
}

export function SplitInner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="split-cta-arrow" aria-hidden="true">
        <ArrowIcon />
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

/** Text link with a trailing arrow that slides and changes color on hover / focus-visible. */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("arrow-cta meta inline-flex items-center underline", className)}>
      {children}
      <ArrowIcon />
    </Link>
  );
}
