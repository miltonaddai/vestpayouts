"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";

/** Relative time that keeps ticking client-side; SSR renders an absolute fallback via `initial`. */
export function TimeAgo({ ms, initial }: { ms: number; initial: string }) {
  const [label, setLabel] = useState(initial);
  useEffect(() => {
    const update = () => setLabel(timeAgo(ms));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [ms]);
  return (
    <time dateTime={new Date(ms).toISOString()} title={new Date(ms).toUTCString()} suppressHydrationWarning>
      {label}
    </time>
  );
}
