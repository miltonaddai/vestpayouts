"use client";

import { timeAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";

/** Relative time that ticks every second on the shared clock; SSR renders `initial`. */
export function TimeAgo({ ms, initial }: { ms: number; initial: string }) {
  const now = useNow();
  const date = new Date(ms);
  return (
    <time dateTime={date.toISOString()} title={now == null ? date.toUTCString() : date.toLocaleString()}>
      {now == null ? initial : timeAgo(ms, now)}
    </time>
  );
}
