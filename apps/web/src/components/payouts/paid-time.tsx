"use client";

import { useSyncExternalStore } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/use-now";

/**
 * "Paid" column: relative time ("5s ago") by default, or the exact date and time
 * in the viewer's own time zone. The choice is shared by every table on the page
 * and remembered in localStorage.
 */
type Mode = "relative" | "exact";
const KEY = "vp:paid-time-mode";
const listeners = new Set<() => void>();
let memo: Mode | null = null;

function readMode(): Mode {
  try {
    return localStorage.getItem(KEY) === "exact" ? "exact" : "relative";
  } catch {
    return "relative";
  }
}

function setMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Private mode or blocked storage: the toggle still works for this page view.
  }
  memo = mode;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memo = readMode();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function usePaidTimeMode() {
  return useSyncExternalStore(
    subscribe,
    () => memo ?? (memo = readMode()),
    () => "relative" as Mode,
  );
}

const exactDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const exactTime = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

export function PaidTimeHeader() {
  const mode = usePaidTimeMode();
  const exact = mode === "exact";
  const Icon = exact ? CalendarDays : Clock;
  return (
    <button
      type="button"
      onClick={() => setMode(exact ? "relative" : "exact")}
      aria-pressed={exact}
      title={exact ? "Showing exact times in your time zone. Click for time ago." : "Showing time ago. Click for exact times."}
      className="-mx-1.5 -my-1 inline-flex items-center gap-1.5 px-1.5 py-1 font-medium tracking-[0.04em] uppercase hover:bg-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      Paid
      <span className="sr-only">{exact ? ", showing exact time. Switch to time ago" : ", showing time ago. Switch to exact time"}</span>
    </button>
  );
}

export function PaidTime({ ms }: { ms: number }) {
  const mode = usePaidTimeMode();
  const now = useNow();
  const iso = new Date(ms).toISOString();

  // Server render (and the first client paint) shows the UTC date, so crawlers
  // and no-JS visitors still get a real timestamp.
  if (now == null) return <time dateTime={iso}>{formatDate(ms, true)}</time>;

  const relative = timeAgo(ms, now);
  const date = exactDate(ms);
  const time = exactTime(ms);
  if (mode === "exact") {
    return (
      <time dateTime={iso} title={relative}>
        {/* Date and time stack on phones, sit on one line from sm up. */}
        <span className="block whitespace-nowrap sm:inline">{date},</span>{" "}
        <span className="block whitespace-nowrap sm:inline">{time}</span>
      </time>
    );
  }
  return (
    <time dateTime={iso} title={`${date}, ${time}`} className="whitespace-nowrap">
      {relative}
    </time>
  );
}
